import MysqlConnector from './mysqlConnector.js';
import jwt from 'jsonwebtoken';
import User from './model/user.js';
import Contest from './model/contest.js';
import sharp from 'sharp';
import fs from 'fs';

jest.mock('jsonwebtoken');
jest.mock('sharp');

describe('Contest Route', () => {
    let userData;
    let user2Data;
    let contestData;

    beforeAll(async () => {
        userData = {
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

        contestData = {
            name: 'Contest 1',
            description: 'Description',
            duration: 180,
            penaltyTime: 20,
            freezeTime: 15,
        };

        jest.spyOn(fs, 'existsSync');
        jest.spyOn(fs, 'mkdirSync');
        jest.spyOn(fs, 'readFileSync');
        jest.spyOn(Date, 'now');

        await MysqlConnector.connect();
        await MysqlConnector.cleanup();
    });

    afterAll(async () => {
        await MysqlConnector.close();
    });

    beforeEach(async () => {
        // default logged user is user1
        jwt.verify.mockImplementation(() => ({ user: userData.email }));

        sharp.mockImplementation(() => ({
            toFormat: () => ({
                toFile: () => {},
            }),
        }));
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockImplementation(() => ({ toString: () => 'image_data' }));
    });
    
    afterEach(async () => {
        jest.clearAllMocks();
        await MysqlConnector.cleanup();
    });

    describe('Insert contest', () => {

        test('should insert a new contest', async () => {
            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
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
            await new User(userData).insert();
            const contest = await new Contest({ ...contestData, name: '' }).insert();
            const { message, status } = contest.lastCall;
            
            expect(message).toBe('Name is required.');
            expect(status).toBe(400);
        });

    });

    describe('Get all contests', () => {
        
        test('should return all contests from an admin', async () => {
            const user = await new User(userData).insert();
            await new User(user2Data).insert();
            const contest1 = await new Contest(contestData).insert();
            const contest2 = await new Contest({ ...contestData, name: 'Contest 2' }).insert();

            // this contest should not be returned
            jwt.verify.mockImplementation(() => ({ user: user2Data.email }));
            await new Contest({ ...contestData, name: 'Contest 3' }).insert();

            jwt.verify.mockImplementation(() => ({ user: userData.email }));
            const res = await Contest.getAll();
            const contests = res.body.contests;
            const { status } = res;

            expect(status).toBe(200);
            expect(contests.length).toBe(2);
            expect(contests[0].name).toBe(contest1.name);
            expect(contests[0].admin).toBe(user.id);
            expect(contests[1].name).toBe(contest2.name);
            expect(contests[1].admin).toBe(user.id);
        });

        test('should return all problems from contests', async () => {
            // TODO: implement this test
        });

        test('should return all teams from contests', async () => {
            // TODO: implement this test
        });
    });

    describe('Get a single contest (admin login)', () => {

        test('should return a single contest', async () => {
            fs.existsSync.mockReturnValue(false);

            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
            await contest.get();
            const { status } = contest.lastCall;

            expect(status).toBe(200);

            // fields in the contestData object
            expect(contest.name).toBe(contestData.name);
            expect(contest.description).toBe(contestData.description);
            expect(contest.duration).toBe(contestData.duration);
            expect(contest.penaltyTime).toBe(contestData.penaltyTime);
            expect(contest.freezeTime).toBe(contestData.freezeTime);

            // fields added by the model
            expect(contest.logo).toBe(false);
            expect(contest.startTime).toBe(null);
            expect(contest.remainingTime).toBe(null);
            expect(contest.finalScoreboard).toBe(false);
            expect(contest.frozenScoreboard).toBe(false);
        });

        test('should return contest problems', async () => {
            // TODO: implement this test
        });

    });

    describe('Get a single contest (team login)', () => {
        // TODO: implement this test
    });

    describe('Update contest', () => {

        test('should update a contest', async () => {
            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();

            const newData = {
                name: 'New Name',
                description: 'New Description',
                duration: 120,
                penaltyTime: 10,
                freezeTime: 5,
            };
            await contest.update(newData);
            const { status, message } = contest.lastCall;

            expect(status).toBe(200);
            expect(message).toBe('Contest updated.');
            expect(contest.name).toBe(newData.name);
            expect(contest.description).toBe(newData.description);
            expect(contest.duration).toBe(newData.duration);
            expect(contest.penaltyTime).toBe(newData.penaltyTime);
            expect(contest.freezeTime).toBe(newData.freezeTime);
        });

        test('should upload contest logo', async () => {
            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
            await contest.updateLogo('image_data');
            const { message, status } = contest.lastCall;
            
            expect(status).toBe(200);
            expect(message).toBe('Logo updated.');
            
            await contest.get();
            expect(contest.logo).toBe('data:image/png;base64,image_data');
        });

        test('should throw an error if not send logo data', async () => {
            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
            await contest.updateLogo(null);
            const { message, status } = contest.lastCall;
            
            expect(status).toBe(400);
            expect(message).toBe('Logo is required.');
        });

        
    });

    describe('Start contest', () => {

        test('should start a contest', async () => {
            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
            await contest.start();
            const { status, message } = contest.lastCall;

            expect(status).toBe(200);
            expect(message).toBe('Contest started.');
            
            // wait 10 seconds to make sure get executes after start
            const now = Date.now();
            Date.now.mockImplementation(() => now + 10000);
            await contest.get();

            expect(contest.startTime).not.toBe(null);
            expect(contest.remainingTime).not.toBe(null);
        });

        test('should not allow to update a contest after it has started', async () => {
            
            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
            await contest.start();
            
            const now = Date.now();
            Date.now.mockImplementation(() => now + 10000);
            await contest.update({ name: 'New Name' });
            const { status, message } = contest.lastCall;

            expect(message).toBe('Contest has already started');
            expect(status).toBe(403);
        });

        test('should not allow to update contest logo after it has started', async () => {
            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
            await contest.start();

            const now = Date.now();
            Date.now.mockImplementation(() => now + 10000);
            await contest.updateLogo('image_data');
            const { status, message } = contest.lastCall;

            expect(message).toBe('Contest has already started');
            expect(status).toBe(403);
        });
    });
});