import MysqlConnector from './mysqlConnector.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import User from './model/user.js';
import Contest from './model/contest.js';
import Team from './model/team.js';
import Problem from './model/problem.js';

jest.mock('jsonwebtoken');
jest.mock('sharp');

describe('Team Route', () => {
    let userData;
    let contestData;
    let problemData;
    let teamData;
    let connector;
    let sqlFile = fs.readFileSync('tests/integration/database-test.sql', 'utf8');

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
        connector = await new MysqlConnector({ sqlFile }).bootstrap();

        // default logged user is user1
        jwt.verify.mockImplementation(() => ({ user: userData.email }));
        jwt.sign.mockReturnValue('valid_token');
        bcrypt.compare.mockImplementation(() => true);

    });
    
    afterEach(async () => {
        jest.clearAllMocks();
        await connector.destroy();
    });

    afterAll(async () => {
        // await MysqlConnector.destroyAll();
    });

    async function insertTeam(data={}) {
        await new User(userData).insert();
        const contest = await new Contest(contestData).insert();
        const problem = await new Problem(problemData).insert();
        await problem.update({
            inputHidden: problemData.inputHidden,
            outputHidden: problemData.outputHidden,
        });
        await contest.addProblem(problem.id);
        
        const team = await new Team({ ...teamData, contest, ...data }).insert();
        await contest.start();

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

    });

    describe('Team login', () => {

        test('should login a team', async () => {
            const team = await insertTeam();
            const {token} = await team.login();

            expect(token).toBe('valid_token');
        });

        test('should not login a team with invalid password', async () => {
            const team = await insertTeam();
            bcrypt.compare.mockImplementation(() => false);
            const res = await team.login();

            expect(res.message).toBe('Invalid password');
            expect(res.status).toBe(401);
        });

    });

});