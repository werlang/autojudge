import Submission from '../../model/submission.js';
import Team from '../../model/team.js';
import Contest from '../../model/contest.js';
import Db from '../../helpers/mysql.js';

jest.mock('../../../helpers/mysql.js');
jest.mock('../../../model/team.js');
jest.mock('../../../model/contest.js');

describe('Submission Class', () => {
    let submission;
    const sampleData = {
        id: 1,
        team: 1,
        problem: 1,
        code: 'sample code',
        filename: 'sample.js',
    };

    beforeEach(() => {
        submission = new Submission(sampleData);
        jest.clearAllMocks();
    });

    test('should create a Submission instance', () => {
        expect(submission).toBeInstanceOf(Submission);
        expect(submission.code).toBe(sampleData.code);
        expect(submission.filename).toBe(sampleData.filename);
    });

    describe('getAll', () => {
        test('should return all submissions', async () => {
            const submissions = [sampleData];
            Db.find.mockResolvedValue(submissions);

            const result = await Submission.getAll({});

            expect(Db.find).toHaveBeenCalledWith('submissions', { filter: {} });
            expect(result).toEqual(submissions);
        });
    });

    describe('isSubmissionEnabled', () => {
        test('should return submission enabled data', async () => {
            const teamData = { id: 1, contest: 1 };
            const contestData = {
                isStarted: jest.fn().mockReturnValue(true),
                getRemainingTime: jest.fn().mockReturnValue(1000),
                getElapsedTime: jest.fn().mockReturnValue(500),
                start_time: new Date(Date.now() - 1000),
            };
            Team.mockImplementation(() => ({ get: jest.fn().mockResolvedValue(teamData) }));
            Contest.mockImplementation(() => ({ get: jest.fn().mockResolvedValue(contestData) }));

            const result = await submission.isSubmissionEnabled();

            expect(result.enabled).toBe(true);
            expect(result.isStarted).toBe(true);
            expect(result.remainingTime).toBe(1000);
            expect(result.elapsedTime).toBe(500);
        });

        test('should throw error if contest has not started', async () => {
            const teamData = { id: 1, contest: 1 };
            const contestData = {
                isStarted: jest.fn().mockReturnValue(false),
                getRemainingTime: jest.fn().mockReturnValue(1000),
                getElapsedTime: jest.fn().mockReturnValue(500),
                start_time: new Date(Date.now() - 1000),
            };
            Team.mockImplementation(() => ({ get: jest.fn().mockResolvedValue(teamData) }));
            Contest.mockImplementation(() => ({ get: jest.fn().mockResolvedValue(contestData) }));

            await expect(submission.isSubmissionEnabled()).rejects.toThrow('Contest has not started yet');
        });

        test('should throw error if submission is before contest start time', async () => {
            const teamData = { id: 1, contest: 1 };
            const contestData = {
                isStarted: jest.fn().mockReturnValue(true),
                getRemainingTime: jest.fn().mockReturnValue(1000),
                getElapsedTime: jest.fn().mockReturnValue(500),
                start_time: new Date(Date.now() + 1000),
            };
            Team.mockImplementation(() => ({ get: jest.fn().mockResolvedValue(teamData) }));
            Contest.mockImplementation(() => ({ get: jest.fn().mockResolvedValue(contestData) }));

            submission.submitted_at = new Date(Date.now() - 2000);

            await expect(submission.isSubmissionEnabled()).rejects.toThrow('Submission is before contest start time');
        });

        test('should throw error if contest has ended', async () => {
            const teamData = { id: 1, contest: 1 };
            const contestData = {
                isStarted: jest.fn().mockReturnValue(true),
                getRemainingTime: jest.fn().mockReturnValue(0),
                getElapsedTime: jest.fn().mockReturnValue(500),
                start_time: new Date(Date.now() - 1000),
            };
            Team.mockImplementation(() => ({ get: jest.fn().mockResolvedValue(teamData) }));
            Contest.mockImplementation(() => ({ get: jest.fn().mockResolvedValue(contestData) }));

            await expect(submission.isSubmissionEnabled()).rejects.toThrow('Contest has ended');
        });

        test('should return submission enabled data with forceReturn', async () => {
            const teamData = { id: 1, contest: 1 };
            const contestData = {
                isStarted: jest.fn().mockReturnValue(false),
                getRemainingTime: jest.fn().mockReturnValue(0),
                getElapsedTime: jest.fn().mockReturnValue(500),
                start_time: new Date(Date.now() - 1000),
            };
            Team.mockImplementation(() => ({ get: jest.fn().mockResolvedValue(teamData) }));
            Contest.mockImplementation(() => ({ get: jest.fn().mockResolvedValue(contestData) }));

            const result = await submission.isSubmissionEnabled(true);

            expect(result.enabled).toBe(false);
            expect(result.isStarted).toBe(false);
            expect(result.remainingTime).toBe(0);
            expect(result.elapsedTime).toBe(500);
        });
    });

    describe('insert', () => {
        test('should insert submission data into the database', async () => {
            submission.isSubmissionEnabled = jest.fn().mockResolvedValue(true);
            Db.insert.mockResolvedValue([{ insertId: 1 }]);
            Db.find.mockResolvedValue([sampleData]);

            await submission.insert();

            expect(submission.isSubmissionEnabled).toHaveBeenCalled();
            expect(Db.insert).toHaveBeenCalledWith('submissions', {
                team: sampleData.team,
                problem: sampleData.problem,
                code: sampleData.code,
                filename: sampleData.filename,
            });
            expect(submission.id).toBe(1);
        });
    });

    describe('updateStatus', () => {
        test('should update submission status and team score', async () => {
            const response = { status: 'ACCEPTED' };
            submission.isSubmissionEnabled = jest.fn().mockResolvedValue({
                team: { updateScore: jest.fn().mockResolvedValue() },
                contest: { penalty_time: 20 },
                elapsedTime: 500,
            });
            Db.update.mockResolvedValue();

            await submission.updateStatus(response);

            expect(Db.update).toHaveBeenCalledWith('submissions', {
                status: 'ACCEPTED',
                score: 500,
                log: response,
            }, submission.id);
        });

        test('should update submission status with penalty time', async () => {
            const response = { status: 'WRONG_ANSWER' };
            submission.isSubmissionEnabled = jest.fn().mockResolvedValue({
                team: { updateScore: jest.fn().mockResolvedValue() },
                contest: { penalty_time: 20 },
                elapsedTime: 500,
            });
            Db.update.mockResolvedValue();

            await submission.updateStatus(response);

            expect(Db.update).toHaveBeenCalledWith('submissions', {
                status: 'WRONG_ANSWER',
                score: 20 * 60 * 1000,
                log: response,
            }, submission.id);
        });

        test('should update submission status with zero score for parsing error', async () => {
            const response = { status: 'PARSING_ERROR' };
            submission.isSubmissionEnabled = jest.fn().mockResolvedValue({
                team: { updateScore: jest.fn().mockResolvedValue() },
                contest: { penalty_time: 10 },
                elapsedTime: 500,
            });
            Db.update.mockResolvedValue();

            await submission.updateStatus(response);

            expect(Db.update).toHaveBeenCalledWith('submissions', {
                status: 'PARSING_ERROR',
                score: 0,
                log: response,
            }, submission.id);
        });
    });
});
