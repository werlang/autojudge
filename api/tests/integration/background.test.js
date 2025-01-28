import MysqlConnector from './mysqlConnector.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import User from './model/user.js';
import Contest from './model/contest.js';
import Team from './model/team.js';
import Problem from './model/problem.js';
import Submission from './model/submission.js';
import Judge from './model/judge.js';

jest.mock('jsonwebtoken');

describe('Backround Tasks', () => {
    let userData;
    let contestData;
    let problemData;
    let teamData;
    let submissionData;
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
            input: ['1 2', '3 4'],
            output: ['3', '7'],
            inputHidden: ['1 2', '3 4'],
            outputHidden: ['3', '7'],
        };

        teamData = {
            id: 1,
            name: 'Team 1',
            password: 'password',
        };

        const rawCode = `#include <stdio.h>\nint main(){ int a, b; scanf("%d %d", &a, &b); printf("%d ", a + b); return 0; }`;

        submissionData = {
            id: 1,
            filename: 'hello.c',
            // b64
            code: Buffer.from(rawCode).toString('base64'),
        };

        jest.spyOn(bcrypt, 'compare');
    });

    beforeEach(async () => {
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] })

        connector = await new MysqlConnector({ sqlFile }).bootstrap();

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

    async function addSubmission(data={}) {
        const elapsedTime = 1000;
        jwt.verify.mockImplementation(() => ({ user: userData.email }));
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
        await contest.get();

        // use mysqlconnector to make contest start_time be in the past
        await connector.query(`UPDATE contests SET start_time = ? WHERE id = ?`, [
            new Date(new Date(contest.startTime).getTime() - elapsedTime),
            contest.id
        ]);

        passTime(elapsedTime);

        await contest.get();

        jwt.verify.mockImplementation(() => ({ team: team.id }));
        const submission = await new Submission({ ...submissionData, problem }).insert();

        return {team, contest, problem, submission};
    }

    test('should submit a problem to be judged', async () => {
        const {submission} = await addSubmission();

        await submission.judge();

        console.log(submission.run);

        expect(submission.run.failed).toBe(0);

        // lots of stuff needs to be tested here to prevent judge from breaking
    });
});

// TODO: /judge endpoint after judge tests are done