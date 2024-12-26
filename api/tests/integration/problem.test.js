import MysqlConnector from './mysqlConnector.js';
import jwt from 'jsonwebtoken';
import User from './model/user.js';
import Problem from './model/problem.js';
import sharp from 'sharp';
import fs from 'fs';

jest.mock('jsonwebtoken');
jest.mock('sharp');

describe('Problem Route', () => {
    let problemData;
    const token = 'valid_token';
    let user1Data, user2Data;

    beforeAll(async () => {
        await MysqlConnector.connect();

        user1Data = {
            name: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password',
        };

        user2Data = {
            name: 'Another',
            lastName: 'User',
            email: 'anotheruser@example.com',
            password: 'password',
        };

        problemData = {
            title: 'Test problem',
            description: 'This is a test problem',
            input: ['input1', 'input2'],
            output: ['output1', 'output2'],
        };

        jest.spyOn(fs, 'existsSync');
        jest.spyOn(fs, 'readFileSync');
        jest.spyOn(fs, 'unlinkSync');

    });

    afterAll(async () => {
        await MysqlConnector.close();
    });
    
    beforeEach(async () => {
        jwt.verify.mockImplementation(() => ({ user: user1Data.email }));
        await MysqlConnector.cleanup();
    });

    describe('Insert problem', () => {

        test('should insert a new problem', async () => {
            await new User(user1Data).insert();
            const problem = new Problem(problemData);
            await problem.insert();
            const { message, status } = problem.lastCall;

            expect(message).toBe('Problem created.');
            expect(status).toBe(201);
            expect(problem.id).toBe(1);
            expect(problem.title).toBe(problem.title);
            expect(problem.description).toBe(problem.description);
            expect(problem.public).toBe(true);
            expect(problem.hash).toBeDefined();
        });

        test('should throw an error if missing required fields', async () => {
            await new User(user1Data).insert();
            const problem = new Problem({
                ...problemData,
                title: null,
            });
            await problem.insert();
            const { message, status } = problem.lastCall;

            expect(message).toBe('Title is required.');
            expect(status).toBe(400);
        });

        test('should handle optional fields correctly', async () => {
            await new User(user1Data).insert();
            const problem = await new Problem({
                title: 'Test problem',
            }).insert();
            const { message, status } = problem.lastCall;

            expect(message).toBe('Problem created.');
            expect(status).toBe(201);
            expect(problem.title).toBe('Test problem');
            expect(problem.description).toBe('');
            expect(problem.public).toBe(true);
        });

        test('should handle boundary conditions', async () => {
            await new User(user1Data).insert();
            const problem = await new Problem({
                ...problemData,
                title: 'a'.repeat(300),
            }).insert();
            const { message, status } = problem.lastCall;

            expect(message).toBe('Title exceeds maximum length.');
            expect(status).toBe(400);
        });
    });

    describe('Get all problems', () => {

        test('should show no problems if problems not public and user not author', async () => {
            await new User(user1Data).insert();
            await Promise.all([
                new Problem({...problemData, public: false}).insert(),
                new Problem({...problemData, public: false}).insert(),
                new Problem({...problemData, public: false}).insert(),
            ]);
            await new User(user2Data).insert();
            jwt.verify.mockImplementation(() => ({ user: user2Data.email}));
            const res = await Problem.getAll(token);

            expect(res.body.problems).toHaveLength(0);
            expect(res.status).toBe(200);
        });

        test('should show public problems if user not author', async () => {
            await new User(user1Data).insert();
            await Promise.all([
                new Problem({...problemData, public: false}).insert(),
                new Problem(problemData).insert(),
                new Problem(problemData).insert(),
            ]);
            await new User(user2Data).insert();
            jwt.verify.mockImplementation(() => ({ user: user2Data.email }));
            const res = await Problem.getAll(token);

            expect(res.body.problems).toHaveLength(2);
            expect(res.body.problems[0].author).toBeUndefined();
            expect(res.status).toBe(200);
        });

        test('should show all problems if user is author', async () => {
            await new User(user1Data).insert();
            await Promise.all([
                new Problem({...problemData, public: false}).insert(),
                new Problem(problemData).insert(),
                new Problem(problemData).insert(),
            ]);
            const res = await Problem.getAll(token);

            expect(res.body.problems).toHaveLength(3);
            expect(res.body.problems[0].author).toBe(true);
            expect(res.status).toBe(200);
        });
    });

    describe('Get problem by hash', () => {

        test('should get a problem by hash being author', async () => {
            await new User(user1Data).insert();
            const problem = await new Problem(problemData).insert().then(problem => problem.get());
            const { status } = problem.lastCall;

            expect(status).toBe(200);
            expect(problem.author).toBe(true);
            expect(problem).toMatchObject({
                title: problemData.title,
                description: problemData.description,
            });
        });

        test('should throw an error if problem not found', async () => {
            await new User(user1Data).insert();
            const problem = await new Problem(problemData).get();
            const { status, message } = problem.lastCall;
            
            expect(message).toBe('Problem not found.');
            expect(status).toBe(404);
        });

        test('should get only public information if problem is not public and user is not author', async () => {
            await new User(user1Data).insert();
            const problem = await new Problem({...problemData, public: false}).insert();
            await new User(user2Data).insert();
            jwt.verify.mockImplementation(() => ({ user: user2Data.email }));

            await problem.get();
            const { status } = problem.lastCall;

            expect(status).toBe(200);
            expect(problem.author).toBeUndefined();
            expect(problem).toMatchObject({
                title: problem.title,
                description: problem.description,
                public: false,
            });
        });

    });

    describe('Update problem', () => {

        async function updateProblem(customArgs={}, updateAsAuthor=true) {
            await new User(user1Data).insert();
            const problem = await new Problem({...problemData, ...customArgs}).insert();

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
                await new User(user2Data).insert();
                jwt.verify.mockImplementation(() => ({ user: user2Data.email }));
            }

            await problem.update(newData);

            return {
                data: newData,
                problem,
                message: problem.lastCall.message,
                status: problem.lastCall.status,
            };
        }

        test('should update a problem', async () => {
            const { problem, data, status, message } = await updateProblem();

            expect(status).toBe(200);
            expect(message).toBe('Problem updated.');
            expect(problem).toMatchObject({
                title: data.title,
                description: data.description,
            });
        });

        test('should throw an error if problem not found', async () => {
            await new User(user1Data).insert();
            const problem = await new Problem({ id: 999 }).update({});
            const { status, message } = problem.lastCall;

            expect(status).toBe(404);
            expect(message).toBe('Item not found');
        });

        test('should throw an error if user is not author', async () => {
            const { status, message } = await updateProblem({}, false);

            expect(status).toBe(403);
            expect(message).toContain('You are not allowed to update this problem.');
        });

        test('should show hidden fields if user is author', async () => {
            const { problem } = await updateProblem();
            await problem.get();
            const { status } = problem.lastCall;

            expect(status).toBe(200);
            expect(problem.inputHidden).toBe('New input hidden');
            expect(problem.outputHidden).toBe('New output hidden');
        });

        test('should hide hidden fields if user is not author', async () => {
            const { problem } = await updateProblem();
            
            await new User(user2Data).insert();
            jwt.verify.mockImplementation(() => ({ user: user2Data.email }));

            await problem.get();
            const { status } = problem.lastCall;

            expect(status).toBe(200);
            expect(problem.inputHidden).toBeUndefined();
            expect(problem.outputHidden).toBeUndefined();
        });
    });

    describe('Problem image', () => {
        async function uploadImage(args) {
            sharp.mockImplementation(() => ({
                resize: () => ({
                    toBuffer: () => Promise.resolve('sample_image'),
                    toFormat: () => ({ toFile: () => Promise.resolve() }),
                }),
            }));
            fs.existsSync.mockImplementation(() => true);
            fs.readFileSync.mockImplementation(() => 'sample_image');
            fs.unlinkSync.mockImplementation(() => {});

            await new User(user1Data).insert();
            const problem = await new Problem(problemData).insert().then(problem => problem.uploadImage(args));
            const { status, message, header } = problem.lastCall;
            return { problem, status, message, header };
        }

        test('should successfully upload an image to a problem', async () => {
            const { status, message } = await uploadImage();
            expect(message).toBe('Image uploaded.');
            expect(status).toBe(200);
        });

        test('should give error if no image is provided', async () => {
            const { status, message } = await uploadImage({ data: null });
            expect(message).toBe('Image is required.');
            expect(status).toBe(400);
        });

        test('should retrieve an image from a problem', async () => {
            const { problem } = await uploadImage();
            await problem.getImage('foo');
            const { status, header } = problem.lastCall;

            expect(problem.image).toBeInstanceOf(Buffer);
            expect(header['content-type']).toContain('image/webp');
            expect(status).toBe(200);
        });

        test('should throw an error if problem not found', async () => {
            await new User(user1Data).insert();
            const problem = await new Problem({ id: 999 }).getImage('foo');
            const { status, message } = problem.lastCall;

            expect(message).toBe('Problem not found.');
            expect(status).toBe(404);
        });

        test('should delete an image from a problem', async () => {
            const { problem } = await uploadImage();
            await problem.deleteImage(problem.id);
            const { message, status } = problem.lastCall;

            expect(message).toBe('Image deleted.');
            expect(status).toBe(200);
        });

        test('should throw an error if problem not found when deleting', async () => {
            await new User(user1Data).insert();
            const problem = await new Problem(problemData).deleteImage(1);
            const { status, message } = problem.lastCall;

            expect(message).toBe('Problem not found.');
            expect(status).toBe(404);
        });
    });

    describe('Problem pdf', () => {

        test('should generate a pdf from a problem', async () => {
            await new User(user1Data).insert();
            const problem = await new Problem(problemData).insert().then(problem => problem.getPdf());
            const { status, header } = problem.lastCall;

            expect(problem.pdf).toBeInstanceOf(Buffer);
            expect(header['content-type']).toBe('application/pdf');
            expect(status).toBe(200);
        });

        test('should throw an error if problem have no description', async () => {
            await new User(user1Data).insert();
            const problem = await new Problem({ title: 'Test problem' }).insert().then(problem => problem.getPdf());
            const { status, message } = problem.lastCall;

            expect(message).toBe('Problem description is required.');
            expect(status).toBe(400);
        });

        test('should generate a pdf from multiple problems, merging them', async () => {
            await new User(user1Data).insert();
            const problems = await Promise.all([
                await new Problem(problemData).insert(),
                await new Problem(problemData).insert(),
                await new Problem(problemData).insert(),
            ]);
            const res = await Problem.getPdf({ problems: problems.map(p => p.hash) });

            expect(res.body).toBeInstanceOf(Buffer);
            expect(res.header['content-type']).toBe('application/pdf');
            expect(res.status).toBe(200);
        });
    });

});