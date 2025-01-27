import MysqlConnector from './mysqlConnector.js';
import jwt from 'jsonwebtoken';
import User from './model/user.js';
import Contest from './model/contest.js';
import Problem from './model/problem.js';
import sharp from 'sharp';
import fs from 'fs';
import Team from './model/team.js';

jest.mock('jsonwebtoken');
jest.mock('sharp');

describe('Contest Route', () => {
    let userData;
    let user2Data;
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

        jest.spyOn(fs, 'existsSync');
        jest.spyOn(fs, 'mkdirSync');
        jest.spyOn(fs, 'readFileSync');
    });

    afterAll(async () => {
    });

    beforeEach(async () => {
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] })

        connector = await new MysqlConnector({ sqlFile }).bootstrap();

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
        jest.useRealTimers();

        jest.clearAllMocks();
        await connector.destroy();
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

        test('should return all teams from contests', async () => {
            const user = await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
            const team1 = await new Team({ name: 'Team 1', contest }).insert();
            const team2 = await new Team({ name: 'Team 2', contest }).insert();

            jwt.verify.mockImplementation(() => ({ user: userData.email }));
            await contest.get();
            
            const teams = contest.teams;
            expect(teams.length).toBe(2);
            expect(teams[0].name).toBe(team1.name);
            expect(teams[1].name).toBe(team2.name);
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

        test('should generate a pdf with the contest problems', async () => {
            // TODO: implement this test
        });

    });

    describe('Contest problems relationship', () => {

        async function addProblem({ hidden = false, contest, user } = {}) {
            user = user || await new User(userData).insert();
            contest = contest || await new Contest(contestData).insert();
            const problem = await new Problem(problemData).insert();
            if (hidden) {
                await problem.update({
                    input: problemData.input,
                    output: problemData.output,
                    inputHidden: problemData.inputHidden,
                    outputHidden: problemData.outputHidden,
                });
            }
            await contest.addProblem(problem.id);
            const { status, message } = contest.lastCall;

            return { user, contest, problem, status, message };
        }

        test('should throw an error if problem does not have hidden test cases', async () => {
            const { status, message } = await addProblem();
            expect(message).toBe('Problem must have hidden test cases');
            expect(status).toBe(400);
        });

        test('should add a problem to a contest', async () => {
            const { status, message } = await addProblem({ hidden: true });
            expect(message).toBe('Problem added to contest.');
            expect(status).toBe(201);
        });

        test('should return all problems from a contest', async () => {
            const { contest, problem, user } = await addProblem({ hidden: true });
            await addProblem({ hidden: true, user, contest });

            const {problems} = (await contest.getProblems()).body;
            const { status } = contest.lastCall;
            
            expect(problems.length).toBe(2);
            expect(status).toBe(200);
            expect(problems[0].id).toBe(problem.id);
            expect(problems[0].title).toBe(problem.title);
            expect(problems[0].description).toBe(problem.description);
            expect(problems[0].input).toBe(JSON.stringify(problem.input));
            expect(problems[0].output).toBe(JSON.stringify(problem.output));
            expect(problems[0].inputHidden).toBe(JSON.stringify(problem.inputHidden));
            expect(problems[0].outputHidden).toBe(JSON.stringify(problem.outputHidden));
        });

        test('problems from other authors should not show hidden test cases', async () => {
            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
            
            jwt.verify.mockImplementation(() => ({ user: user2Data.email }));
            await new User(user2Data).insert();
            const problem = await new Problem(problemData).insert();
            await problem.update({
                inputHidden: problemData.inputHidden,
                outputHidden: problemData.outputHidden,
            });
            
            jwt.verify.mockImplementation(() => ({ user: userData.email }));
            await contest.addProblem(problem.id);

            const {problems} = (await contest.getProblems()).body;
            const { status } = contest.lastCall;

            expect(problems.length).toBe(1);
            expect(status).toBe(200);
            expect(problems[0].id).toBe(problem.id);
            expect(problems[0].title).toBe(problem.title);
            expect(problems[0].description).toBe(problem.description);
            expect(problems[0].inputHidden).toBe(undefined);
            expect(problems[0].outputHidden).toBe(undefined);
        });

        test('should remove a problem from a contest', async () => {
            const { contest, problem } = await addProblem({ hidden: true });
            await contest.removeProblem(problem.id);
            const { status, message } = contest.lastCall;

            expect(message).toBe('Problem removed from contest.');
            expect(status).toBe(200);
        });

        test('should change problem color and order in a contest', async () => {
            const { contest, problem } = await addProblem({ hidden: true });
            await contest.updateProblem(problem.id, { color: 'red', order: 1 });
            const { status, message } = contest.lastCall;

            expect(message).toBe('Problem updated.');
            expect(status).toBe(200);

            const problems = (await contest.getProblems()).body.problems;
            expect(problems[0].color).toBe('red');
            expect(problems[0].order).toBe(1);
        });
    });

    describe('Get a single contest (team login)', () => {
        
        test('should return a single contest', async () => {
            fs.existsSync.mockReturnValue(false);

            jwt.verify.mockImplementation(() => ({ user: userData.email }));
            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
            
            const team = await new Team({ ...teamData, contest }).insert();
            await team.login();
            jwt.verify.mockImplementation(() => ({ team: teamData.id }));

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

    async function startContest() {
        const user = await new User(userData).insert();
        const contest = await new Contest(contestData).insert();
        const team = await new Team({ ...teamData, contest }).insert();
        const problem = await new Problem(problemData).insert();
        await problem.update({
            inputHidden: problemData.inputHidden,
            outputHidden: problemData.outputHidden,
        });
        await contest.addProblem(problem.id);
        const { status, message } = contest.lastCall;

        await contest.start();

        return { user, contest, problem, team, status, message };
    }

    describe('Start contest', () => {

        test('should not allow to start a contest with no problems', async () => {
            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
            await contest.start();
            const { status, message } = contest.lastCall;

            expect(status).toBe(400);
            expect(message).toBe('Contest must have at least one problem');
        });

        test('should start a contest', async () => {
            const { contest } = await startContest();
            const { status, message } = contest.lastCall;

            expect(message).toBe('Contest started.');
            expect(status).toBe(200);
            
            // wait 1 second to make sure get executes after start
            passTime(1000);
            await contest.get();

            expect(contest.startTime).not.toBe(null);
            expect(contest.remainingTime).not.toBe(null);
        });

        test('should not allow to start a contest that has already started', async () => {
            const { contest } = await startContest();

            passTime(1000);

            await contest.start();
            const { status, message } = contest.lastCall;

            expect(message).toBe('Contest has already started');
            expect(status).toBe(403);
        });

        test('should not allow to update a contest after it has started', async () => {
            const { contest } = await startContest();
            
            passTime(1000);
            await contest.update({ name: 'New Name' });
            const { status, message } = contest.lastCall;

            expect(message).toBe('Contest has already started');
            expect(status).toBe(403);
        });

        test('should not allow to update contest logo after it has started', async () => {
            const { contest } = await startContest();

            passTime(1000);
            await contest.updateLogo('image_data');
            const { status, message } = contest.lastCall;

            expect(message).toBe('Contest has already started');
            expect(status).toBe(403);
        });

        test('should not allow to update contest problems after it has started', async () => {
            const { contest, problem } = await startContest();

            passTime(1000);
            await contest.addProblem(problem.id);
            const { status, message } = contest.lastCall;

            expect(message).toBe('Contest has already started');
            expect(status).toBe(403);
        });

        test('should not allow to remove a problem after contest has started', async () => {
            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
            const problem = await new Problem(problemData).insert();
            await problem.update({
                input: problemData.input,
                output: problemData.output,
                inputHidden: problemData.inputHidden,
                outputHidden: problemData.outputHidden,
            });
            await contest.addProblem(problem.id);
            await contest.start();

            passTime(1000);
            await contest.removeProblem(problem.id);
            const { status, message } = contest.lastCall;

            expect(message).toBe('Contest has already started');
            expect(status).toBe(403);
        });

    });

    describe('Unlock contest', () => {

        test('should unlock a contest', async () => {
            const { contest } = await startContest();
            await contest.get();
            
            expect(contest.finalScoreboard).toBe(false);
            expect(contest.frozenScoreboard).toBe(false);
            
            const lapse = (contest.duration - contest.freezeTime + 1) * 60 * 1000;
            passTime(lapse);
            
            await contest.get();
            expect(contest.finalScoreboard).toBe(false);
            expect(contest.frozenScoreboard).toBe(true);

            await contest.unlock();
            const { message } = contest.lastCall;

            await contest.get();
            expect(message).toBe('Contest unlocked.');
            expect(contest.finalScoreboard).toBe(true);

        });

        test('should not allow to unlock a contest that has not started', async () => {
            await new User(userData).insert();
            const contest = await new Contest(contestData).insert();
            await contest.unlock();
            const { status, message } = contest.lastCall;

            expect(status).toBe(403);
            expect(message).toBe('Contest has not started yet');
        });

        test('should not allow to unlock a contest that is not locked (frozen)', async () => {
            const { contest } = await startContest();
            await contest.get();
            await contest.unlock();

            passTime(1000);

            // unlock again, should throw an error
            await contest.unlock();
            const { status, message } = contest.lastCall;

            expect(status).toBe(403);
            expect(message).toBe('Contest is not frozen');
        });
    });
});