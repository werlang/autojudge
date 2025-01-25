import MysqlConnector from './mysqlConnector.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import User from './model/user.js';
import Contest from './model/contest.js';
import Team from './model/team.js';
import Problem from './model/problem.js';
import Submission from './model/submission.js';

// TODO: check for coverage. insert new tests

jest.mock('jsonwebtoken');

describe('Submission Route', () => {
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

        submissionData = {
            id: 1,
            filename: 'test.cpp',
            code: 'foo.bar'
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

    async function startContest(data={}) {
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

        passTime(1000);

        return {team, contest, problem};
    }

    describe('Submission insert', () => {

        test('should insert a submission', async () => {
            const {problem} = await startContest();

            jwt.verify.mockImplementation(() => ({ team: teamData.id }));
            const submission = await new Submission({...submissionData, problem}).insert();
            const { message, status } = submission.lastCall;

            expect(message).toBe('Submission received');
            expect(status).toBe(201);
        });

        test('should not insert a submission if problem is not in contest', async () => {
            const {problem} = await startContest();
            problem.id++;

            jwt.verify.mockImplementation(() => ({ team: teamData.id }));
            const submission = await new Submission({...submissionData, problem}).insert();
            const { message, status } = submission.lastCall;

            expect(message).toBe('Problem not found in contest.');
            expect(status).toBe(404);
        });

        test('should not insert a submission if code is missing', async () => {
            const { problem } = await startContest();

            jwt.verify.mockImplementation(() => ({ team: teamData.id }));
            const submission = await new Submission({ ...submissionData, code: null, problem }).insert();
            const { message, status } = submission.lastCall;

            expect(message).toBe('Code is required');
            expect(status).toBe(400);
        });

        test('should not insert a submission if filename is missing', async () => {
            const { problem } = await startContest();

            jwt.verify.mockImplementation(() => ({ team: teamData.id }));
            const submission = await new Submission({ ...submissionData, filename: null, problem }).insert();
            const { message, status } = submission.lastCall;

            expect(message).toBe('Filename is required');
            expect(status).toBe(400);
        });

        test('should not insert a submission if problem does not have hidden test cases', async () => {
            const { problem } = await startContest();
            await problem.update({ inputHidden: [], outputHidden: [] });

            jwt.verify.mockImplementation(() => ({ team: teamData.id }));
            const submission = await new Submission({ ...submissionData, problem }).insert();
            const { message, status } = submission.lastCall;

            expect(message).toBe('Problem does not have hidden test cases');
            expect(status).toBe(403);
        });

        test('should not insert a submission if contest has not started', async () => {
            const { problem } = await startContest();

            passTime(-10000);

            jwt.verify.mockImplementation(() => ({ team: teamData.id }));
            const submission = await new Submission({ ...submissionData, problem }).insert();
            const { message, status } = submission.lastCall;

            expect(message).toBe('Contest has not started yet');
            expect(status).toBe(400);
        });



        // TODO: this, after manual submission test is done
        // test('should not insert a submission if team already solved the problem', async () => {

        // });

    });

    describe('Submission get', () => {

        test('should get all submissions for a team', async () => {
            const {problem} = await startContest();

            jwt.verify.mockImplementation(() => ({ team: teamData.id }));
            await new Submission({...submissionData, problem}).insert();

            const {submissions} = await Submission.getAll();

            expect(submissions.length).toBe(1);
            expect(submissions[0].id).toBe(1);
            expect(submissions[0].status).toBe('PENDING');
            expect(submissions[0].score).toBe(0);
            expect(submissions[0].hint).toBe(null);
            expect(submissions[0].problem.id).toBe(problem.id);
            expect(submissions[0].problem.title).toBe(problem.title);
        });

        test('should get a specific submission by ID', async () => {
            const { team, problem } = await startContest();

            jwt.verify.mockImplementation(() => ({ team: team.id }));
            const submission = await new Submission({ ...submissionData, problem }).insert();

            await submission.get();

            expect(submission.id).toBe(1);
            expect(submission.status).toBe('PENDING');
            expect(submission.score).toBe(0);
            expect(submission.team).toBe(team.id);
            expect(submission.problem).toBe(problem.id);

        });

        test('should return 404 if submission not found', async () => {
            const { team } = await startContest();

            jwt.verify.mockImplementation(() => ({ team: team.id }));
            const submission = await new Submission({ ...submissionData }).get();
            const { message, status } = submission.lastCall;

            expect(message).toBe('Item not found');
            expect(status).toBe(404);
        });

        test('should not allow if team is not authorized to view submission', async () => {
            const { team, problem } = await startContest();

            jwt.verify.mockImplementation(() => ({ team: team.id }));
            const submission = await new Submission({ ...submissionData, problem }).insert();

            jwt.verify.mockImplementation(() => ({ team: team.id + 1 }));
            await submission.get();
            const { message, status } = submission.lastCall;

            expect(message).toBe('Item not found');
            expect(status).toBe(404);
        });

        test('should return all accepted submissions', async () => {
            const { team, problem } = await startContest();

            jwt.verify.mockImplementation(() => ({ team: team.id }));
            const submissionList = await Promise.all([
                new Submission({ ...submissionData, id: 1, problem }).insert(),
                new Submission({ ...submissionData, id: 2, problem }).insert(),
                new Submission({ ...submissionData, id: 3, problem }).insert(),
            ]);

            passTime(1000);

            jwt.verify.mockImplementation(() => ({ user: userData.email }));
            const acceptedList = await Promise.all([
                submissionList[0].updateStatus('ACCEPTED'),
                submissionList[2].updateStatus('ACCEPTED'),
            ]);

            jwt.verify.mockImplementation(() => ({ team: team.id }));
            const { submissions } = await Submission.getAccepted();

            expect(submissions.length).toBe(2);
        });
            
        // TODO: this, after background service test is done
        // test('should return all submissions with status PENDING', async () => {
        // });

    });

    describe('Submission manual update', () => {

        test('should update a submission if user is admin', async () => {
            const { team, problem } = await startContest();

            jwt.verify.mockImplementation(() => ({ team: team.id }));
            const submission = await new Submission({ ...submissionData, problem }).insert();

            passTime(1000);

            jwt.verify.mockImplementation(() => ({ user: userData.email }));
            await submission.updateStatus('ACCEPTED');


            expect(submission.status).toBe('ACCEPTED');
            // as mysql time cannot be mocked, we cannot test the score
            expect(submission.score).toBe(0);
        });

        test('should not allow update if user is not admin', async () => {
            const { team, problem } = await startContest();

            jwt.verify.mockImplementation(() => ({ team: team.id }));
            const submission = await new Submission({ ...submissionData, problem }).insert();

            passTime(1000);

            jwt.verify.mockImplementation(() => ({ user: 'not_admin@example.com' }));
            await submission.updateStatus('ACCEPTED');
            const { message, status } = submission.lastCall;

            expect(message).toBe('Invalid token. Item not found');
            expect(status).toBe(401);
        });

        test('should not update if status is invalid', async () => {
            const { team, problem } = await startContest();

            jwt.verify.mockImplementation(() => ({ team: team.id }));
            const submission = await new Submission({ ...submissionData, problem }).insert();

            passTime(1000);

            jwt.verify.mockImplementation(() => ({ user: userData.email }));
            await submission.updateStatus('INVALID_STATUS');
            const { message, status } = submission.lastCall;

            expect(message).toBe('Invalid status');
            expect(status).toBe(400);
        });

    });

});