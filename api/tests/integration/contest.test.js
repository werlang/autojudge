import MysqlConnector from './mysqlConnector.js';
import jwt from 'jsonwebtoken';
import User from './model/user.js';
import Contest from './model/contest.js';

jest.mock('jsonwebtoken');

describe('Problem Route', () => {
    let userData;
    let contestData;

    beforeAll(async () => {
        userData = {
            name: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password',
        };

        contestData = {
            name: 'Contest 1',
            description: 'Description',
            duration: 180,
            penaltyTime: 20,
            freezeTime: 15,
        };


        await MysqlConnector.connect();
        await MysqlConnector.cleanup();
    });

    afterAll(async () => {
        await MysqlConnector.close();
    });

    beforeEach(async () => {
        // default logged user is user1
        jwt.verify.mockImplementation(() => ({ user: userData.email }));
    });
    
    afterEach(async () => {
        await MysqlConnector.cleanup();
    });

    describe('Insert contest', () => {

        test('should insert a new problem', async () => {
            const user = await new User(userData).insert();
            const contest = await new Contest({ ...contestData, admin: user.id }).insert();
            const { message, status } = contest.lastCall;

            expect(message).toBe('Contest created.');
            expect(status).toBe(201);
            expect(contest.name).toBe(contestData.name);
            expect(contest.description).toBe(contestData.description);
            expect(contest.duration).toBe(contestData.duration);
            expect(contest.penaltyTime).toBe(contestData.penaltyTime);
            expect(contest.freezeTime).toBe(contestData.freezeTime);
        });

        test('should throw an error if sending an empty name', async () => {
            const user = await new User(userData).insert();
            const contest = await new Contest({ ...contestData, name: '', admin: user.id }).insert();
            const { message, status } = contest.lastCall;
            
            expect(message).toBe('Name is required.');
            expect(status).toBe(400);
        });

    });
});