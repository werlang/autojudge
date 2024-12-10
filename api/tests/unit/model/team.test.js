import Team from '../../../model/team.js';
import Contest from '../../../model/contest.js';
import Submission from '../../../model/submission.js';
import Db from '../../../helpers/mysql.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

jest.mock('../../../helpers/mysql.js');
jest.mock('../../../model/contest.js');
jest.mock('../../../model/submission.js');
jest.mock('bcrypt');
jest.mock('uuid');

describe('Team Class', () => {
    let team;
    const sampleData = {
        id: 1,
        hash: 'sampleHash',
        name: 'Sample Team',
        contest: 1,
        password: 'password123',
    };

    beforeEach(() => {
        team = new Team(sampleData);
        jest.clearAllMocks();
    });

    test('should create a Team instance', () => {
        expect(team).toBeInstanceOf(Team);
        expect(team.name).toBe(sampleData.name);
        expect(team.contest).toBe(sampleData.contest);
        expect(team.password).toBe(sampleData.password);
    });

    describe('getAll', () => {
        test('should return all teams', async () => {
            const teams = [sampleData];
            Db.find.mockResolvedValue(teams);

            const result = await Team.getAll({});

            expect(Db.find).toHaveBeenCalledWith('teams', { filter: {} });
            expect(result).toEqual(teams);
        });
    });

    describe('get', () => {
        test('should get team data by id', async () => {
            Db.find.mockResolvedValue([sampleData]);

            await team.get();

            expect(Db.find).toHaveBeenCalledWith('teams', { filter: { id: team.id } });
            expect(team.name).toBe(sampleData.name);
            expect(team.contest).toBe(sampleData.contest);
        });

        test('should get team data by hash', async () => {
            team.id = null;
            Db.find.mockResolvedValue([sampleData]);

            await team.get();

            expect(Db.find).toHaveBeenCalledWith('teams', { filter: { hash: team.hash } });
            expect(team.name).toBe(sampleData.name);
            expect(team.contest).toBe(sampleData.contest);
        });

        test('should throw error if id or hash is not provided', async () => {
            team.id = null;
            team.hash = null;

            await expect(team.get()).rejects.toThrow('ID or hash is required');
        });
    });

    describe('insert', () => {
        test('should insert team data into the database', async () => {
            uuidv4.mockReturnValue('newHash');
            Db.insert.mockResolvedValue([{ insertId: 1 }]);
            Db.find.mockResolvedValue([{ ...sampleData, id: 1, hash: 'newHash' }]);
            Contest.mockImplementation(() => {
                return {
                    get: jest.fn().mockResolvedValue({ isStarted: jest.fn().mockReturnValue(false) }),
                };
            });

            await team.insert();

            expect(uuidv4).toHaveBeenCalled();
            expect(Db.insert).toHaveBeenCalledWith('teams', {
                name: sampleData.name,
                contest: sampleData.contest,
                hash: 'newHash',
            });
            expect(team.id).toBe(1);
            expect(team.hash).toBe('newHash');
        });

        test('should throw error if contest has already started', async () => {
            Contest.mockImplementation(() => {
                return {
                    get: jest.fn().mockResolvedValue({ isStarted: jest.fn().mockReturnValue(true) }),
                };
            });

            await expect(team.insert()).rejects.toThrow('Contest has already started');
        });
    });

    describe('resetPassword', () => {
        test('should reset team password', async () => {
            const newPassword = '123456';
            bcrypt.hash.mockResolvedValue('hashedPassword');
            Db.update.mockResolvedValue();
            jest.spyOn(Math, 'random').mockReturnValue(0.123456);

            const result = await team.resetPassword();

            expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
            expect(Db.update).toHaveBeenCalledWith('teams', { password: 'hashedPassword' }, team.id);
            expect(result).toBe(newPassword);
            expect(team.password).toBe(newPassword);
        });
    });

    describe('updateScore', () => {
        test('should update team score based on submissions', async () => {
            const submissions = [
                { id: 1, problem: 1, status: 'ACCEPTED', score: 100, submitted_at: new Date().toISOString() },
                { id: 2, problem: 1, status: 'WRONG_ANSWER', score: 0, submitted_at: new Date().toISOString() },
                { id: 3, problem: 2, status: 'ACCEPTED', score: 50, submitted_at: new Date().toISOString() },
            ];
            Submission.getAll.mockResolvedValue(submissions);
            Db.update.mockResolvedValue();

            await team.updateScore();

            expect(Submission.getAll).toHaveBeenCalledWith({ team: team.id });
            expect(Db.update).toHaveBeenCalledWith('teams', { score: 150 }, team.id);
        });

        test('should update team score based on submissions with multiple submissions for the same problem', async () => {
            const submissions = [
                { id: 1, problem: 1, status: 'WRONG_ANSWER', score: 20, submitted_at: new Date(Date.now() - 1000000).toISOString() },
                { id: 2, problem: 1, status: 'ACCEPTED', score: 200, submitted_at: new Date(Date.now() - 800000).toISOString() },
                { id: 3, problem: 1, status: 'ACCEPTED', score: 400, submitted_at: new Date(Date.now() - 600000).toISOString() },
                { id: 4, problem: 2, status: 'ACCEPTED', score: 600, submitted_at: new Date(Date.now() - 400000).toISOString() },
                { id: 5, problem: 1, status: 'WRONG_ANSWER', score: 20, submitted_at: new Date(Date.now() - 200000).toISOString() },
            ];
            Submission.getAll.mockResolvedValue(submissions);
            Db.update.mockResolvedValue();

            await team.updateScore();

            expect(Submission.getAll).toHaveBeenCalledWith({ team: team.id });
            expect(Db.update).toHaveBeenCalledWith('teams', { score: 820 }, team.id);
        });
    });

    describe('delete', () => {
        test('should deactivate the team', async () => {
            Db.update.mockResolvedValue();

            await team.delete();

            expect(Db.update).toHaveBeenCalledWith('teams', { is_active: 0 }, team.id);
        });
    });

    describe('getActive', () => {
        test('should get active team data by id', async () => {
            Db.find.mockResolvedValue([sampleData]);

            await team.getActive();

            expect(Db.find).toHaveBeenCalledWith('teams', { filter: { id: team.id, is_active: 1 } });
            expect(team.name).toBe(sampleData.name);
            expect(team.contest).toBe(sampleData.contest);
        });
    });
});
