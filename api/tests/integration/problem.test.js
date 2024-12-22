import MysqlConnector from './mysqlConnector.js';
import jwt from 'jsonwebtoken';
import User from './model/user.js';
import Problem from './model/problem.js';

jest.mock('jsonwebtoken');

describe('Problem Route', () => {
    let problem;
    const token = 'valid_token';
    let user;

    beforeAll(async () => {
        await MysqlConnector.connect();

        user = {
            name: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password',
        };

        problem = {
            title: 'Test problem',
            description: 'This is a test problem',
            input: 'input',
            output: 'output',
            inputHidden: 'inputHidden',
            outputHidden: 'outputHidden',
        };

    });

    afterAll(async () => {
        await MysqlConnector.close();
    });
    
    beforeEach(async () => {
        jwt.verify.mockImplementation(() => ({ user: user.email }));
        await MysqlConnector.cleanup();
    });

    describe('Insert problem', () => {

        test('should insert a new problem', async () => {
            await new User(user).insert();
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
            await new User(user).insert();
            const res = await new Problem({
                ...problem,
                title: null,
            }).insert();

            expect(res.body.message).toBe('Title is required.');
            expect(res.status).toBe(400);
        });
    });

    describe('Get all problems', () => {

        test('should show no problems if problems not public and user not author', async () => {
            await new User(user).insert();
            await Promise.all([
                new Problem({...problem, public: false}).insert(),
                new Problem({...problem, public: false}).insert(),
                new Problem({...problem, public: false}).insert(),
            ]);
            jwt.verify.mockImplementation(() => ({ user: 'anotheruser@example.com' }));
            const res = await Problem.getAll(token);

            expect(res.body.problems).toHaveLength(0);
            expect(res.status).toBe(200);
        });

        test('should show public problems if user not author', async () => {
            await new User(user).insert();
            await Promise.all([
                new Problem({...problem, public: false}).insert(),
                new Problem(problem).insert(),
                new Problem(problem).insert(),
            ]);
            jwt.verify.mockImplementation(() => ({ user: 'anotheruser@example.com' }));
            const res = await Problem.getAll(token);

            expect(res.body.problems).toHaveLength(2);
            // expect(res.body.problems[0].input).toBe(problem.input);
            // expect(res.body.problems[0].inputHidden).toBeUndefined();
            expect(res.status).toBe(200);
        });

        test('should show all problems if user is author', async () => {
            await new User(user).insert();
            await Promise.all([
                new Problem({...problem, public: false}).insert(),
                new Problem(problem).insert(),
                new Problem(problem).insert(),
            ]);
            const res = await Problem.getAll(token);

            expect(res.body.problems).toHaveLength(3);
            expect(res.status).toBe(200);
        });
    });
});