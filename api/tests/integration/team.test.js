import MysqlConnector from './mysqlConnector.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import User from './model/user.js';
import Contest from './model/contest.js';
import Team from './model/team.js';

jest.mock('jsonwebtoken');
jest.mock('sharp');

describe('Team Route', () => {
    let userData;
    let contestData;
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

        teamData = {
            id: 1,
            name: 'Team 1',
            password: 'password',
        };

    });

    beforeEach(async () => {
        connector = await new MysqlConnector({ sqlFile }).bootstrap();

        // default logged user is user1
        jwt.verify.mockImplementation(() => ({ user: userData.email }));

    });
    
    afterEach(async () => {
        jest.clearAllMocks();
        await connector.destroy();
    });

    afterAll(async () => {
    });

    describe('Team insert', () => {

        test('should insert a team', async () => {
            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
            const team = await new Team({ ...teamData, contest }).insert();
            const { message, status } = team.lastCall;

            expect(message).toContain('Team created.');
            expect(status).toBe(201);
            expect(team.id).toBe(1);
            expect(team.hash).toHaveLength(6);
            expect(team.name).toBe('Team 1');
            expect(team.password).toHaveLength(6);
            // { id: 1, hash: 'f60111', name: 'Team 1', password: '420935' },
        });

    });

    describe('Team login', () => {

        test('should login a team', async () => {
            const user = await new Team(userData).login();

            expect(user.body).toBe(1);
        });

    });

});