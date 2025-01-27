import MysqlConnector from './mysqlConnector.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import User from './model/user.js';
import Contest from './model/contest.js';
import Team from './model/team.js';
import Problem from './model/problem.js';

jest.mock('jsonwebtoken');

describe('Team Route', () => {
    let userData;
    let contestData;
    let problemData;
    let teamData;
    let connector;
    let sqlFile = fs.readFileSync('tests/integration/database-test.sql', 'utf8');

    const passTime = time => jest.setSystemTime(new Date(Date.now() + time));

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

        problemData = {
            title: 'Test problem',
            description: 'This is a test problem',
            input: ['input1', 'input2'],
            output: ['output1', 'output2'],
            inputHidden: ['input1', 'input2'],
            outputHidden: ['output1', 'output2'],
        };

        teamData = {
            id: 1,
            name: 'Team 1',
            password: 'password',
        };

        jest.spyOn(bcrypt, 'compare');

    });

    beforeEach(async () => {
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] })

        connector = await new MysqlConnector({ sqlFile }).bootstrap();

        // default logged user is user1
        jwt.verify.mockImplementation(() => ({ user: userData.email }));
        jwt.sign.mockReturnValue('valid_token');
        bcrypt.compare.mockImplementation(() => true);

    });
    
    afterEach(async () => {
        jest.useRealTimers();

        jest.clearAllMocks();
        await connector.destroy();
    });

    afterAll(async () => {
        // await MysqlConnector.destroyAll();
    });

    async function insertTeam(data={}, start=true) {
        await new User(userData).insert();
        const contest = await new Contest(contestData).insert();
        const problem = await new Problem(problemData).insert();
        await problem.update({
            inputHidden: problemData.inputHidden,
            outputHidden: problemData.outputHidden,
        });
        await contest.addProblem(problem.id);
        
        const team = await new Team({ ...teamData, contest, ...data }).insert();
        if (start) {
            await contest.start();
        }

        return team;
    }

    describe('Team insert', () => {

        test('should insert a team', async () => {
            const team = await insertTeam();
            const { message, status } = team.lastCall;

            expect(message).toContain('Team created.');
            expect(status).toBe(201);
            expect(team.id).toBe(1);
            expect(team.hash).toHaveLength(6);
            expect(team.name).toBe('Team 1');
            expect(team.password).toHaveLength(6);
            // { id: 1, hash: 'f60111', name: 'Team 1', password: '420935' },
        });

        test('should not allow to insert a team without a name', async () => {
            const team = await insertTeam({ name: null });
            const { message, status } = team.lastCall;

            expect(message).toContain('Name is required.');
            expect(status).toBe(400);
        });

        test('should not allow to insert a if contest has started', async () => {
            const team = await insertTeam();
            const contest = await new Contest({ id: team.contest }).get();
            await contest.start();

            passTime(1000);

            await team.insert();
            const { message, status } = team.lastCall;

            expect(message).toContain('Contest has already started');
            expect(status).toBe(403);
        });

        test('should not allow to insert a team if not contest admin', async () => {
            jwt.verify.mockImplementation(() => ({ user: 'foo.bar@example.com' }));
            const team = await insertTeam();
            await team.insert();
            const { message, status } = team.lastCall;

            expect(status).toBe(401);
        });

    });

    describe('Team login', () => {

        test('should login a team', async () => {
            const team = await insertTeam();
            
            passTime(1000);
            const {token} = await team.login();

            expect(token).toBe('valid_token');
        });

        test('should not login a team with invalid password', async () => {
            const team = await insertTeam();
            bcrypt.compare.mockImplementation(() => false);

            passTime(1000);

            const res = await team.login();

            expect(res.message).toBe('Invalid password');
            expect(res.status).toBe(401);
        });

    });

    describe('Team get', () => {

        test('should get a team', async () => {
            const team = await insertTeam();

            passTime(1000);

            await team.login();
            jwt.verify.mockImplementation(() => ({ team: teamData.id }));
            await team.get();

            expect(team.id).toBe(1);
            expect(team.hash).toHaveLength(6);
            expect(team.name).toBe('Team 1');
            expect(team.score).toBe(0);
            expect(team.contest.id).toBe(1);
            expect(team.contest.name).toBe('Contest 1');
            expect(team.contest.description).toBe('Description');
            expect(team.contest.logo).toBe(false);
        });

        test('should not get a team if not logged', async () => {
            const team = await insertTeam();
            jwt.verify.mockImplementation(() => ({}));
            await team.get();
            const { message, status } = team.lastCall;

            expect(message).toBe('Invalid token.');
            expect(status).toBe(401);
        });

    });

    describe('Team update', () => {
        
        test('should update a team', async () => {
            const team = await insertTeam();
            // user logged is the contest admin
            jwt.verify.mockImplementation(() => ({ user: userData.email }));
    
            await team.update({ name: 'New name' });

            expect(team.name).toBe('New name');
        });

        test('should not update a team without a name', async () => {
            const team = await insertTeam();
            jwt.verify.mockImplementation(() => ({ user: userData.email }));

            await team.update({ name: null });
            const { message, status } = team.lastCall;

            expect(message).toContain('Name is required.');
            expect(status).toBe(400);
        });

        test('should not update a team score directly', async () => {
            const team = await insertTeam();
            jwt.verify.mockImplementation(() => ({ user: userData.email }));

            await team.update({ name: 'New name', score: 100 });
            const { message, status } = team.lastCall;

            expect(message).toContain('Score cannot be updated directly.');
            expect(status).toBe(403);
        });

        test('should reset a team password', async () => {
            const team = await insertTeam();
            const oldPassword = team.password;
            jwt.verify.mockImplementation(() => ({ user: userData.email }));
    
            await team.resetPassword();
    
            expect(team.password).not.toBe(oldPassword);
        });

        test('should not reset a team password if not contest admin', async () => {
            const team = await insertTeam();
            jwt.verify.mockImplementation(() => ({ user: 'foo.bar@example.com' }));

            await team.resetPassword();
            const { message, status } = team.lastCall;

            expect(status).toBe(401);
        });
    });

    describe('Team delete', () => {

        test('should not delete a team if contest has started', async () => {
            const team = await insertTeam();
            jwt.verify.mockImplementation(() => ({ user: userData.email }));
            
            passTime(1000);

            await team.delete();
            const { message, status } = team.lastCall;
    
            expect(message).toContain('Contest has already started');
            expect(status).toBe(403);
        });

        test('should delete a team', async () => {
            const team = await insertTeam({}, false);
            jwt.verify.mockImplementation(() => ({ user: userData.email }));
    
            passTime(1000);

            await team.delete();
            const { message } = team.lastCall;
    
            expect(message).toContain('Team removed.');
        });

        test('should not delete a team if not contest admin', async () => {
            const team = await insertTeam({}, false);
            jwt.verify.mockImplementation(() => ({ user: 'foo.bar@example.com' }));

            passTime(1000);

            await team.delete();
            const { message, status } = team.lastCall;

            expect(status).toBe(401);
        });

    });

});