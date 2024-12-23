import MysqlConnector from './mysqlConnector.js';
import jwt from 'jsonwebtoken';
import User from './model/user.js';
import Problem from './model/problem.js';
import sharp from 'sharp';
import fs from 'fs';
import Test from 'supertest/lib/test.js';

jest.mock('jsonwebtoken');
jest.mock('sharp');
// jest.mock('fs');

describe('Problem Route', () => {
    let problem;
    const token = 'valid_token';
    let user1, user2;

    beforeAll(async () => {
        await MysqlConnector.connect();

        user1 = {
            name: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password',
        };

        user2 = {
            name: 'Another',
            lastName: 'User',
            email: 'anotheruser@example.com',
            password: 'password',
        };

        problem = {
            title: 'Test problem',
            description: 'This is a test problem',
            input: 'input',
            output: 'output',
        };

        jest.spyOn(fs, 'existsSync');
        jest.spyOn(fs, 'readFileSync');
        jest.spyOn(fs, 'unlinkSync');

    });

    afterAll(async () => {
        await MysqlConnector.close();
    });
    
    beforeEach(async () => {
        jwt.verify.mockImplementation(() => ({ user: user1.email }));
        await MysqlConnector.cleanup();
    });

    describe('Insert problem', () => {

        test('should insert a new problem', async () => {
            await new User(user1).insert();
            const res = await new Problem(problem).insert();

            expect(res.body.message).toBe('Problem created.');
            expect(res.status).toBe(201);
            expect(res.body.problem.id).toBe(1);
            expect(res.body.problem.title).toBe(problem.title);
            expect(res.body.problem.description).toBe(problem.description);
            expect(res.body.problem.public).toBe(true);
            expect(res.body.problem.hash).toBeDefined();
        });

        test('should throw an error if missing required fields', async () => {
            await new User(user1).insert();
            const res = await new Problem({
                ...problem,
                title: null,
            }).insert();

            expect(res.body.message).toBe('Title is required.');
            expect(res.status).toBe(400);
        });

        test('should handle optional fields correctly', async () => {
            await new User(user1).insert();
            const res = await new Problem({
                title: 'Test problem',
            }).insert();

            expect(res.body.message).toBe('Problem created.');
            expect(res.status).toBe(201);
            expect(res.body.problem.title).toBe('Test problem');
            expect(res.body.problem.description).toBe('');
            expect(res.body.problem.public).toBe(true);
        });

        test('should handle boundary conditions', async () => {
            await new User(user1).insert();
            const res = await new Problem({
                ...problem,
                title: 'a'.repeat(300),
            }).insert();

            expect(res.body.message).toBe('Title exceeds maximum length.');
            expect(res.status).toBe(400);
        });
    });

    describe('Get all problems', () => {

        test('should show no problems if problems not public and user not author', async () => {
            await new User(user1).insert();
            await Promise.all([
                new Problem({...problem, public: false}).insert(),
                new Problem({...problem, public: false}).insert(),
                new Problem({...problem, public: false}).insert(),
            ]);
            await new User(user2).insert();
            jwt.verify.mockImplementation(() => ({ user: user2.email}));
            const res = await Problem.getAll(token);

            expect(res.body.problems).toHaveLength(0);
            expect(res.status).toBe(200);
        });

        test('should show public problems if user not author', async () => {
            await new User(user1).insert();
            await Promise.all([
                new Problem({...problem, public: false}).insert(),
                new Problem(problem).insert(),
                new Problem(problem).insert(),
            ]);
            await new User(user2).insert();
            jwt.verify.mockImplementation(() => ({ user: user2.email }));
            const res = await Problem.getAll(token);

            expect(res.body.problems).toHaveLength(2);
            expect(res.body.problems[0].author).toBeUndefined();
            expect(res.status).toBe(200);
        });

        test('should show all problems if user is author', async () => {
            await new User(user1).insert();
            await Promise.all([
                new Problem({...problem, public: false}).insert(),
                new Problem(problem).insert(),
                new Problem(problem).insert(),
            ]);
            const res = await Problem.getAll(token);

            expect(res.body.problems).toHaveLength(3);
            expect(res.body.problems[0].author).toBe(true);
            expect(res.status).toBe(200);
        });
    });

    describe('Get problem by hash', () => {

        test('should get a problem by hash being author', async () => {
            await new User(user1).insert();
            const newProblem = await new Problem(problem).insert();
            const res = await new Problem(newProblem.body.problem).get();

            expect(res.status).toBe(200);
            expect(res.body.problem.author).toBe(true);
            expect(res.body.problem).toMatchObject(newProblem.body.problem);
        });

        test('should throw an error if problem not found', async () => {
            await new User(user1).insert();
            const res = await new Problem(problem).get();

            expect(res.body.message).toBe('Problem not found.');
            expect(res.status).toBe(404);
        });

        test('should get only public information if problem is not public and user is not author', async () => {
            await new User(user1).insert();
            const newProblem = await new Problem({...problem, public: false}).insert();
            await new User(user2).insert();
            jwt.verify.mockImplementation(() => ({ user: user2.email }));

            const res = await new Problem(newProblem.body.problem).get();

            expect(res.status).toBe(200);
            expect(res.body.problem.author).toBeUndefined();
            expect(res.body.problem).toMatchObject({
                title: newProblem.body.problem.title,
                description: newProblem.body.problem.description,
                public: false,
            });
        });

    });

    describe('Update problem', () => {

        async function updateProblem(customArgs={}, updateAsAuthor=true) {
            await new User(user1).insert();
            const newProblem = await new Problem({...problem, ...customArgs}).insert();

            const newData = {
                title: 'New title',
                description: 'New description',
                public: false,
                input: 'New input',
                output: 'New output',
                inputHidden: 'New input hidden',
                outputHidden: 'New output hidden',
            };

            if (!updateAsAuthor) {
                await new User(user2).insert();
                jwt.verify.mockImplementation(() => ({ user: user2.email }));
            }

            const res = await new Problem(newProblem.body.problem).update(newData);

            return {
                data: newData,
                problem: newProblem.body.problem,
                res,
            };
        }

        test('should update a problem', async () => {
            const { data, res } = await updateProblem();

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Problem updated.');
            expect(res.body.problem).toMatchObject({
                title: data.title,
                description: data.description,
            });
        });

        test('should throw an error if problem not found', async () => {
            await new User(user1).insert();
            const res = await new Problem({ id: 999 }).update({});

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Item not found');
        });

        test('should throw an error if user is not author', async () => {
            const { res } = await updateProblem({}, false);

            expect(res.status).toBe(403);
            expect(res.body.message).toContain('You are not allowed to update this problem.');
        });

        test('should show hidden fields if user is author', async () => {
            const { problem } = await updateProblem();

            const res = await new Problem(problem).get();

            expect(res.status).toBe(200);
            expect(res.body.problem.inputHidden).toBe('New input hidden');
            expect(res.body.problem.outputHidden).toBe('New output hidden');
        });

        test('should hide hidden fields if user is not author', async () => {
            const { problem } = await updateProblem();
            
            await new User(user2).insert();
            jwt.verify.mockImplementation(() => ({ user: user2.email }));

            const res = await new Problem(problem).get();

            expect(res.status).toBe(200);
            expect(res.body.problem.inputHidden).toBeUndefined();
            expect(res.body.problem.outputHidden).toBeUndefined();
        });
    });

    describe('Problem image', () => {
        async function uploadImage() {
            sharp.mockImplementation(() => ({
                resize: () => ({
                    toBuffer: () => Promise.resolve('sample_image'),
                    toFormat: () => ({ toFile: () => Promise.resolve() }),
                }),
            }));
            fs.existsSync.mockImplementation(() => true);
            fs.readFileSync.mockImplementation(() => 'sample_image');
            fs.unlinkSync.mockImplementation(() => {});

            await new User(user1).insert();
            const newProblem = await new Problem(problem).insert();
            const res = await new Problem(newProblem.body.problem).uploadImage();
            return { problem: newProblem.body.problem, res };
        }

        test('should successfully upload an image to a problem', async () => {
            const {res} = await uploadImage();
            expect(res.body.message).toBe('Image uploaded.');
            expect(res.status).toBe(200);
        });

        test('should retrieve an image from a problem', async () => {
            const { problem, res } = await uploadImage();
            let res2 = await new Problem(problem).getImage(res.body.id);

            expect(res2.body).toBeInstanceOf(Buffer);
            expect(res2.headers['content-type']).toContain('image/webp');
            expect(res2.status).toBe(200);
        });

        test('should delete an image from a problem', async () => {
            const { problem, res } = await uploadImage();
            let res2 = await new Problem(problem).deleteImage(res.body.id);

            expect(res2.body.message).toBe('Image deleted.');
            expect(res2.status).toBe(200);
        });
    });

});