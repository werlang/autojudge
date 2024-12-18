import Contest from '../../../model/contest.js';
import Problem from '../../../model/problem.js';
import Submission from '../../../model/submission.js';
import Team from '../../../model/team.js';
import Db from '../../../helpers/mysql.js';
import fs from 'fs';

jest.mock('../../../helpers/mysql.js');
jest.mock('../../../model/problem.js');
jest.mock('../../../model/team.js');
jest.mock('../../../model/submission.js');

describe('Contest Class', () => {
    let contest;
    const sampleData = {
        id: 1,
        name: 'Sample Contest',
        description: 'This is a sample contest.',
        admin: 1,
        duration: 120,
        penalty_time: 20,
        freeze_time: 30,
    };

    beforeAll(() => {
        jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
        jest.spyOn(fs, 'readFileSync').mockImplementation(() => Buffer.from('logoData').toString('base64'));
        jest.spyOn(Date, 'now').mockReturnValue(Date.now());
    });

    beforeEach(() => {
        contest = new Contest(sampleData);
        jest.clearAllMocks();
    });

    test('should create a Contest instance', () => {
        expect(contest).toBeInstanceOf(Contest);
        expect(contest.name).toBe(sampleData.name);
        expect(contest.description).toBe(sampleData.description);
        expect(contest.admin).toBe(sampleData.admin);
    });

    describe('getAll', () => {
        test('should return all contests with logos', async () => {
            const contests = [sampleData];
            Db.find.mockResolvedValue(contests);

            const result = await Contest.getAll({});

            expect(Db.find).toHaveBeenCalledWith('contests', { filter: {} });
            expect(result[0].logo).toBe(`data:image/png;base64,${Buffer.from('logoData').toString('base64')}`);
        });

        test('should return all contests without logos if not found', async () => {
            const contests = [sampleData];
            Db.find.mockResolvedValue(contests);
            fs.existsSync.mockReturnValue(false);

            const result = await Contest.getAll({});

            expect(Db.find).toHaveBeenCalledWith('contests', { filter: {} });
            expect(result[0].logo).toBe(false);
        });
    });

    describe('get', () => {
        test('should get contest data by id with logo', async () => {
            Db.find.mockResolvedValue([sampleData]);
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(Buffer.from('logoData'));

            await contest.get();

            expect(Db.find).toHaveBeenCalledWith('contests', { filter: { id: contest.id } });
            expect(contest.logo).toBe(`data:image/png;base64,${Buffer.from('logoData').toString('base64')}`);
        });

        test('should get contest data by id without logo if not found', async () => {
            Db.find.mockResolvedValue([sampleData]);
            fs.existsSync.mockReturnValue(false);

            await contest.get();

            expect(Db.find).toHaveBeenCalledWith('contests', { filter: { id: contest.id } });
            expect(contest.logo).toBe(false);
        });
    });

    describe('addProblem', () => {
        test('should add a problem to the contest', async () => {
            contest.isStarted = jest.fn().mockReturnValue(false);
            contest.insertRelation = jest.fn().mockResolvedValue();

            await contest.addProblem({ problem: 1 });

            expect(contest.isStarted).toHaveBeenCalled();
            expect(contest.insertRelation).toHaveBeenCalledWith('problem', { problem: 1 });
        });

        test('should throw error if contest has already started', async () => {
            contest.isStarted = jest.fn().mockReturnValue(true);

            await expect(contest.addProblem({ problem: 1 })).rejects.toThrow('Contest has already started');
        });
    });

    describe('getProblems', () => {
        test('should get all problems related to the contest', async () => {
            const relations = [{ problem: 1, order: 1, color: 'red' }];
            contest.getRelation = jest.fn().mockResolvedValue(relations);
            Problem.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue({ id: 1, title: 'Sample Problem' }),
            }));

            const result = await contest.getProblems();

            expect(contest.getRelation).toHaveBeenCalledWith('problem');
            expect(result[0].id).toBe(1);
            expect(result[0].order).toBe(1);
            expect(result[0].color).toBe('red');
        });
    });

    describe('removeProblem', () => {
        test('should remove a problem from the contest', async () => {
            contest.isStarted = jest.fn().mockReturnValue(false);
            contest.deleteRelation = jest.fn().mockResolvedValue();

            await contest.removeProblem({ problem: 1 });

            expect(contest.isStarted).toHaveBeenCalled();
            expect(contest.deleteRelation).toHaveBeenCalledWith('problem', { problem: 1 });
        });

        test('should throw error if contest has already started', async () => {
            contest.isStarted = jest.fn().mockReturnValue(true);

            await expect(contest.removeProblem({ problem: 1 })).rejects.toThrow('Contest has already started');
        });
    });

    describe('updateProblem', () => {
        test('should update a problem in the contest', async () => {
            contest.updateRelation = jest.fn().mockResolvedValue();

            await contest.updateProblem({ problem: 1 }, { order: 2 });

            expect(contest.updateRelation).toHaveBeenCalledWith('problem', { problem: 1 }, { order: 2 });
        });
    });

    describe('isStarted', () => {
        test('should return true if contest has started', () => {
            contest.start_time = new Date(Date.now() - 1000);
            expect(contest.isStarted()).toBe(true);
        });

        test('should return false if contest has not started', () => {
            contest.start_time = null;
            expect(contest.isStarted()).toBe(false);
        });
    });

    describe('start', () => {
        test('should start the contest', async () => {
            contest.isStarted = jest.fn().mockReturnValue(false);
            const now = Date.now();
            Db.toDateTime.mockReturnValue('datetime');
            contest.update = jest.fn().mockResolvedValue();

            await contest.start();

            expect(contest.isStarted).toHaveBeenCalled();
            expect(Db.toDateTime).toHaveBeenCalledWith(now);
            expect(contest.update).toHaveBeenCalledWith({ start_time: 'datetime' });
        });

        test('should throw error if contest has already started', async () => {
            contest.isStarted = jest.fn().mockReturnValue(true);

            await expect(contest.start()).rejects.toThrow('Contest has already started');
        });
    });

    describe('getElapsedTime', () => {
        test('should return elapsed time if contest has started', () => {
            contest.start_time = Date.now() - 10000;
            expect(contest.getElapsedTime()).toBe(10000);
        });

        test('should return elapsed time with target time', () => {
            contest.start_time = Date.now() - 10000;
            expect(contest.getElapsedTime(Date.now() + 10000)).toBe(20000);
        });

        test('should return 0 if contest has not started', () => {
            contest.start_time = null;
            expect(contest.getElapsedTime()).toBe(0);
        });
    });

    describe('getRemainingTime', () => {
        test('should return remaining time if contest has started', () => {
            contest.start_time = Date.now();
            contest.duration = 120;
            contest.isStarted = jest.fn().mockReturnValue(true);
            contest.getElapsedTime = jest.fn().mockReturnValue(0);
            expect(contest.getRemainingTime()).toBe(contest.duration * 60 * 1000);
        });

        test('should return 0 if contest has not started', () => {
            contest.start_time = null;
            expect(contest.getRemainingTime()).toBe(0);
        });
    });

    describe('isFrozen', () => {
        test('should return true if contest is frozen', () => {
            contest.getRemainingTime = jest.fn().mockReturnValue(10 * 60 * 1000);
            contest.freeze_time = 15;
            expect(contest.isFrozen()).toBe(true);
        });

        test('should return false if contest is not frozen', () => {
            contest.getRemainingTime = jest.fn().mockReturnValue(10 * 60 * 1000);
            contest.freeze_time = 2;
            expect(contest.isFrozen()).toBe(false);
        });
    });

    describe('isRunning', () => {
        test('should return true if contest is running', () => {
            contest.start_time = new Date(Date.now() - 1000);
            contest.duration = 2;
            expect(contest.isRunning()).toBe(true);
        });

        test('should return false if contest is not running', () => {
            contest.start_time = null;
            expect(contest.isRunning()).toBe(false);
        });
    });

    describe('getTeams', () => {
        test('should return teams with solved problems', async () => {
            contest.isFrozen = jest.fn().mockReturnValue(false);
            Team.getAll.mockResolvedValue([{ id: 1, name: 'Team 1', score: 100 }]);
            const solvedProblems = [
                { team: 1, problem: 1, status: 'ACCEPTED', submitted_at: new Date(Date.now()).toISOString() },
                { team: 1, problem: 1, status: 'ACCEPTED', submitted_at: new Date(Date.now()).toISOString() }, // intentionally duplicated
            ];
            Submission.getAll.mockResolvedValue(solvedProblems);

            const result = await contest.getTeams();

            expect(Team.getAll).toHaveBeenCalledWith({ contest: contest.id, is_active: 1 });
            expect(result[0].id).toBe(1);
            expect(result[0].name).toBe('Team 1');
            expect(result[0].score).toBe(100);
            expect(result[0].solvedProblems).toEqual([1]);
        });

        test('should return teams with solved problems filtered by freeze time', async () => {
            contest.isFrozen = jest.fn().mockReturnValue(true);
            contest.is_unlocked = false;
            contest.start_time = new Date(Date.now() - 1000 * 60);
            contest.duration = 2;
            contest.freeze_time = 1.5;
            Team.getAll.mockResolvedValue([{ id: 1, name: 'Team 1', score: 100 }]);
            Submission.getAll.mockResolvedValue([{ team: 1, problem: 1, status: 'ACCEPTED', submitted_at: new Date().toISOString() }]);

            const result = await contest.getTeams();

            expect(Team.getAll).toHaveBeenCalledWith({ contest: contest.id, is_active: 1 });
            expect(result[0].solvedProblems).toEqual([]);
        });

        test('should return teams with solved problems if contest is unlocked', async () => {
            contest.isFrozen = jest.fn().mockReturnValue(true);
            contest.is_unlocked = true;
            Team.getAll.mockResolvedValue([{ id: 1, name: 'Team 1', score: 100 }]);
            Submission.getAll.mockResolvedValue([{ team: 1, problem: 1, status: 'ACCEPTED', submitted_at: new Date(Date.now()).toISOString() }]);

            const result = await contest.getTeams();

            expect(Team.getAll).toHaveBeenCalledWith({ contest: contest.id, is_active: 1 });
            expect(result[0].solvedProblems).toEqual([1]);
        });
    });

    describe('unlock', () => {
        test('should unlock the contest', async () => {
            contest.isStarted = jest.fn().mockReturnValue(true);
            contest.isFrozen = jest.fn().mockReturnValue(true);
            contest.update = jest.fn().mockResolvedValue();

            await contest.unlock();

            expect(contest.isStarted).toHaveBeenCalled();
            expect(contest.isFrozen).toHaveBeenCalled();
            expect(contest.update).toHaveBeenCalledWith({ is_unlocked: 1 });
        });

        test('should throw error if contest has not started', async () => {
            contest.isStarted = jest.fn().mockReturnValue(false);

            await expect(contest.unlock()).rejects.toThrow('Contest has not started yet');
        });

        test('should throw error if contest is not frozen', async () => {
            contest.isStarted = jest.fn().mockReturnValue(true);
            contest.isFrozen = jest.fn().mockReturnValue(false);

            await expect(contest.unlock()).rejects.toThrow('Contest is not frozen');
        });
    });
});
