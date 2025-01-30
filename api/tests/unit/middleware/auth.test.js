import auth from '../../../middleware/auth.js';
import CustomError from '../../../helpers/error.js';
import User from '../../../model/user.js';
import Team from '../../../model/team.js';
import Contest from '../../../model/contest.js';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Submission from '../../../model/submission.js';

jest.mock('../../../model/user.js');
jest.mock('../../../model/team.js');
jest.mock('../../../model/contest.js');
jest.mock('../../../model/submission.js');
jest.mock('google-auth-library');
jest.mock('jsonwebtoken');
jest.mock('bcrypt');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            params: {},
            body: {},
        };
        res = {};
        next = jest.fn();
        jest.clearAllMocks();
    });

    test('should just fail', async () => {
        await auth({})(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    describe('checkToken', () => {
        test('should throw error if token not found', async () => {
            await auth({ 'user:token': true })(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toBe('Token not found.');
        });

        test('should throw error if token is invalid', async () => {
            req.headers.authorization = 'Bearer invalid_token';
            OAuth2Client.prototype.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

            await auth({ 'user:token': true })(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toBe('Invalid token.');
        });

        test('should set authPayload if token is valid', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const payload = { sub: '123' };
            OAuth2Client.prototype.verifyIdToken.mockResolvedValue({ getPayload: () => payload });

            await auth({ 'user:token': true })(req, res, next);

            expect(req.authPayload).toEqual(payload);
            expect(next).toHaveBeenCalledWith();
        });
    });

    describe('checkUserGoogle', () => {
        test('should set user if google token is valid', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const payload = { sub: 'google123' };
            OAuth2Client.prototype.verifyIdToken.mockResolvedValue({ getPayload: () => payload });
            User.mockImplementation(() => ({
                getBy: jest.fn().mockResolvedValue({ id: 1, google_id: 'google123' }),
            }));

            await auth({ 'user:exists': true })(req, res, next);

            expect(req.user).toEqual({ id: 1, google_id: 'google123' });
            expect(next).toHaveBeenCalledWith();
        });
    });

    describe('authUser', () => {
        test('should throw error if email or password is missing', async () => {
            await auth({ 'user:password': true })(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toBe('Email and password are required.');
        });

        test('should throw error if user not found', async () => {
            req.body.email = 'test@example.com';
            req.body.password = 'password123';
            User.mockImplementation(() => ({
                getBy: jest.fn().mockRejectedValue(new Error('User not found')),
            }));

            await auth({ 'user:password': true })(req, res, next);
            expect(req.user).toBeNull();
        });

        test('should throw error if user has no password', async () => {
            req.body.email = 'test@example.com';
            req.body.password = 'password123';
            User.mockImplementation(() => ({
                getBy: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' }),
            }));

            await auth({ 'user:password': true })(req, res, next);
            expect(req.user.id).toBe(1);
            expect(req.user.email).toBe('test@example.com');
            expect(req.user.password).toBeUndefined();
        });

        test('should set user if password is valid', async () => {
            req.body.email = 'test@example.com';
            req.body.password = 'password123';
            const user = { id: 1, email: 'test@example.com', password: 'hashed_password' };
            User.mockImplementation(() => ({
                getBy: jest.fn().mockResolvedValue(user),
            }));
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('jwt_token');

            await auth({ 'user:password': true })(req, res, next);

            expect(req.user).toEqual({ ...user, token: 'jwt_token' });
            expect(next).toHaveBeenCalledWith();
        });

        test('should throw error if password is invalid', async () => {
            req.body.email = 'test@example.com';
            req.body.password = 'password123';
            const user = { id: 1, email: 'test@example.com', password: 'hashed_password' };
            User.mockImplementation(() => ({
                getBy: jest.fn().mockResolvedValue(user),
            }));
            bcrypt.compare.mockResolvedValue(false);
            jwt.sign.mockReturnValue('jwt_token');

            await auth({ 'user:password': true })(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toBe('Invalid password');
        });

        test('should set info when user is optional', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const user = { email: 'test@example.com' };
            jwt.verify.mockReturnValue({ user: user.email });
            const payload = { sub: '123' };
            OAuth2Client.prototype.verifyIdToken.mockResolvedValue({ getPayload: () => payload });
            User.mockImplementation(() => ({
                getBy: jest.fn().mockResolvedValue(user),
            }));

            await auth({ 'user:optional': true })(req, res, next);

            expect(req.user).toEqual(user);
            expect(next).toHaveBeenCalledWith();
        });
    });

    describe('checkUserJWT', () => {
        test('should throw error if token not provided', async () => {
            await auth({ 'user:exists': true })(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('Token not provided.');
        });

        test('should throw error if token is invalid', async () => {
            req.headers.authorization = 'Bearer invalid_token';
            User.mockImplementation(() => ({
                getBy: jest.fn().mockResolvedValue(user),
            }));
            jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

            await auth({ 'user:exists': true })(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('Invalid token.');
        });

        test('should set user if token is valid (google auth)', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const user = { email: 'test@example.com' };
            jwt.verify.mockReturnValue({ user: user.email });
            const payload = { sub: '123' };
            OAuth2Client.prototype.verifyIdToken.mockResolvedValue({ getPayload: () => payload });
            User.mockImplementation(() => ({
                getBy: jest.fn().mockResolvedValue(user),
            }));

            await auth({ 'user:exists': true })(req, res, next);

            expect(req.user).toEqual(user);
            expect(next).toHaveBeenCalledWith();
        });

        test('should set user if token is valid (password auth)', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const user = { email: 'test@example.com' };
            jwt.verify.mockReturnValue({ user: user.email });
            OAuth2Client.prototype.verifyIdToken.mockRejectedValue(new Error('Invalid token'));
            User.mockImplementation(() => ({
                getBy: jest.fn().mockResolvedValue(user),
            }));

            await auth({ 'user:exists': true })(req, res, next);

            expect(req.user).toEqual(user);
            expect(next).toHaveBeenCalledWith();
        });

        test('should throw error if token does not match user', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const user = { email: 'test@example.com' };
            jwt.verify.mockReturnValue({ user: 'wrong.email@example.com' });
            OAuth2Client.prototype.verifyIdToken.mockRejectedValue(new Error('Invalid token'));
            User.mockImplementation(() => ({
                getBy: jest.fn().mockResolvedValue(user),
            }));

            await auth({ 'user:exists': true })(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('User not found');
        });
    });

    describe('authTeam', () => {
        test('should throw error if password not provided', async () => {
            await auth({ 'team:login': true })(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('Password not found');
        });

        test('should throw error if team not found', async () => {
            req.headers.authorization = 'Bearer password123';
            Team.mockImplementation(() => ({
                get: jest.fn().mockRejectedValue(new Error('Team not found')),
            }));
            Team.getAll = jest.fn().mockResolvedValue([]);

            await auth({ 'team:login': true })(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('Invalid password');
        });

        test('should throw error if password is invalid', async () => {
            req.headers.authorization = 'Bearer password123';
            const team = { id: 1, password: 'hashed_password' };
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(team),
            }));
            Team.getAll = jest.fn().mockResolvedValue([]);
            bcrypt.compare.mockResolvedValue(false);

            await auth({ 'team:login': true })(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('Invalid password');
        });

        test('should set team if password is valid', async () => {
            req.headers.authorization = 'Bearer password123';
            const team = { id: 1, password: 'hashed_password' };
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(team),
            }));
            Contest.mockImplementation(() => ({
                get: jest.fn().mockImplementation(function(){ return Promise.resolve(this)}),
                isRunning: jest.fn().mockReturnValue(true),
            }));
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('jwt_token');

            await auth({ 'team:login': true })(req, res, next);

            expect(req.team).toEqual({ ...team, token: 'jwt_token' });
            expect(next).toHaveBeenCalledWith();
        });

        test('should set team using hash if password is valid', async () => {
            req.headers.authorization = 'Bearer password123';
            const team = { password: 'hashed_password', hash: 'team_hash' };
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(team),
            }));
            Team.getAll.mockResolvedValue([{ id: 1, ...team }]);
            Contest.mockImplementation(() => ({
                get: jest.fn().mockImplementation(function(){ return Promise.resolve(this)}),
                isRunning: jest.fn().mockReturnValue(true),
            }));
            bcrypt.compare = jest.fn()
                .mockResolvedValueOnce(false)
                .mockResolvedValueOnce(true);
            jwt.sign.mockReturnValue('jwt_token');

            await auth({ 'team:login': true })(req, res, next);

            expect(req.team).toEqual({ ...team, id: 1, token: 'jwt_token' });
            expect(next).toHaveBeenCalledWith();
        });

        test('should throw error if team hash is ambiguous', async () => {
            req.headers.authorization = 'Bearer password123';
            const team = { password: 'hashed_password', hash: 'team_hash' };
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(team),
            }));
            Team.getAll.mockResolvedValue([
                { id: 1, ...team },
                { id: 2, ...team },
                { id: 3, ...team },
            ]);
            bcrypt.compare = jest.fn()
                .mockResolvedValueOnce(false)
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false);
            jwt.sign.mockReturnValue('jwt_token');

            await auth({ 'team:login': true })(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('Ambiguous hash');
        });

        test('should throw error if contest is not running', async () => {
            req.headers.authorization = 'Bearer password123';
            const team = { id: 1, password: 'hashed_password' };
            Contest.mockImplementation(() => ({
                id: 1,
                isRunning: jest.fn().mockReturnValue(false),
                get: jest.fn().mockImplementation(function(){ return Promise.resolve(this)}),
            }));
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(team),
            }));
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('jwt_token');

            await auth({ 'team:login': true })(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('The contest is not running');
        });

    });

    describe('checkTeam', () => {
        test('should throw error if token not provided', async () => {
            await auth({ 'team:exists': true })(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('Token not provided.');
        });

        test('should throw error if token is invalid', async () => {
            req.headers.authorization = 'Bearer invalid_token';
            jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

            await auth({ 'team:exists': true })(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('Invalid token.');
        });

        test('should set team if token is valid', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const team = { id: 1 };
            jwt.verify.mockReturnValue({ team: team.id });
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(team),
            }));

            await auth({ 'team:exists': true })(req, res, next);

            expect(req.team).toEqual(team);
            expect(next).toHaveBeenCalledWith();
        });
    });

    describe('isTeamMember', () => {
        test('should set team if team member', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const team = { id: 1, contest: 1 };
            jwt.verify.mockReturnValue({ team: team.id });
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(team),
                getAll: jest.fn().mockResolvedValue([team]),
            }));

            await auth({ 'team:member': true })(req, res, next);

            expect(req.team).toEqual(team);
            expect(next).toHaveBeenCalledWith();
        });

        test('should throw error if not a team member', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const team = { id: 1, contest: 1 };
            jwt.verify.mockReturnValue({ team: team.id });
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(new Error('Team not found')),
                getAll: jest.fn().mockResolvedValue([]),
            }));

            await auth({ 'team:member': true })(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('Team not found');
        });

        test('should set team if searching by contest', async () => {
            req.headers.authorization = 'Bearer valid_token';
            req.team = { id: 3 };
            const teamsInContest = [ { id: 1, contest: 1 }, { id: 2, contest: 1 }, { id: 3, contest: 1 } ];
            jwt.verify.mockReturnValue({ team: req.team.id });
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(req.team),
            }));
            Team.getAll.mockResolvedValue(teamsInContest);

            await auth({ 'team:contest': true })(req, res, next);

            expect(req.team).toEqual(teamsInContest[2]);
        });

        test('should set team if searching by contest and using custom field', async () => {
            req.headers.authorization = 'Bearer valid_token';
            req.team = { id: 3 };
            const teamsInContest = [ { id: 1, contest: 1 }, { id: 2, contest: 1 }, { id: 3, contest: 1 } ];
            jwt.verify.mockReturnValue({ team: req.team.id });
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(req.team),
            }));
            Team.getAll.mockResolvedValue(teamsInContest);

            req.params.foo = 1;
            await auth({ 'team:contest': 'foo' })(req, res, next);

            expect(req.team).toEqual(teamsInContest[2]);
        });

        test('should throw error if team is not in the contest', async () => {
            req.headers.authorization = 'Bearer valid_token';
            req.team = { id: 4 };
            const teamsInContest = [ { id: 1, contest: 1 }, { id: 2, contest: 1 }, { id: 3, contest: 1 } ];
            jwt.verify.mockReturnValue({ team: req.team.id });
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(req.team),
            }));
            Team.getAll.mockResolvedValue(teamsInContest);

            req.params.foo = 1;
            await auth({ 'team:contest': 'foo' })(req, res, next);

            expect(req.team).toBeNull();
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('You are not allowed to access this resource');
        });

        test('should set team using a custom argument to set id', async () => {
            req.headers.authorization = 'Bearer valid_token';
            jwt.verify.mockReturnValue({ team: 1 });
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue({ id: 1, contest: 1 }),
                getAll: jest.fn().mockResolvedValue([]),
            }));

            req.params.foo = 1;
            await auth({ 'team:member': 'foo' })(req, res, next);

            expect(req.team).toEqual({ id: 1, contest: 1 });
            expect(next).toHaveBeenCalledWith();
        });

        test('should check if the user owns the submission', async () => {
            req.headers.authorization = 'Bearer valid_token';
            jwt.verify.mockReturnValue({ team: 1 });
            Submission.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue({ team: 1 }),
            }));

            await auth({ 'team:submission': true })(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        test('should check if the user owns the submission using custom field', async () => {
            req.headers.authorization = 'Bearer valid_token';
            jwt.verify.mockReturnValue({ team: 1 });
            // req.team = { id: 1 };
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue({ id: 1 }),
            }));
            Submission.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue({ id: 1, team: 1 }),
            }));

            req.params.foo = 1;
            await auth({ 'team:submission': 'foo' })(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        test('should throw error if team is not the owner of the submission', async () => {
            req.headers.authorization = 'Bearer valid_token';
            jwt.verify.mockReturnValue({ team: 1 });
            // req.team = { id: 1 };
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue({ id: 1 }),
            }));
            Submission.mockImplementation(() => ({
                get: jest.fn().mockRejectedValue(new Error('Submission not found')),
            }));

            req.params.foo = 1;
            await auth({ 'team:submission': 'foo' })(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('Submission not found');
        });
    });

    describe('isContestAdmin', () => {
        test('should set contest if user is admin', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const user = { id: 1 };
            const contest = { id: 1, admin: 1 };
            jwt.verify.mockReturnValue({ id: user.id, user: user.email });
            const payload = { sub: '123' };
            OAuth2Client.prototype.verifyIdToken.mockResolvedValue({ getPayload: () => payload });
            User.mockImplementation(() => ({
                getBy: jest.fn().mockResolvedValue(user),
            }));
            Contest.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(contest),
            }));

            await auth({ 'contest:admin': true })(req, res, next);

            expect(req.contest).toEqual(contest);
        });

        test('should set contest if user is admin searching id on custom param', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const user = { id: 1 };
            const contest = { id: 1, admin: 1 };
            jwt.verify.mockReturnValue({ id: user.id, user: user.email });
            const payload = { sub: '123' };
            OAuth2Client.prototype.verifyIdToken.mockResolvedValue({ getPayload: () => payload });
            User.mockImplementation(() => ({
                getBy: jest.fn().mockResolvedValue(user),
            }));
            Contest.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(contest),
            }));

            req.params.foo = 1
            await auth({ 'contest:admin': 'foo' })(req, res, next);

            expect(req.contest).toEqual(contest);
        });

        test('should set team when user is admin', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const user = { id: 1 };
            const team = { id: 1, contest: 1 };
            jwt.verify.mockReturnValue({ id: user.id, user: user.email });
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(team),
            }));

            await auth({ 'contest:admin:team': true })(req, res, next);

            expect(req.team).toEqual(team);
            expect(next).toHaveBeenCalledWith();
        });

        test('should set team when user is admin using custom field', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const user = { id: 1 };
            const team = { id: 1, contest: 1 };
            jwt.verify.mockReturnValue({ id: user.id, user: user.email });
            Team.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(team),
            }));

            req.params.foo = 1;
            await auth({ 'contest:admin:team': 'foo' })(req, res, next);

            expect(req.team).toEqual(team);
            expect(next).toHaveBeenCalledWith();
        });

        test('should throw error if user is not admin', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const user = { id: 1, email: 'test@example.com' };
            const contest = { id: 1, admin: 2 };
            jwt.verify.mockReturnValue({ user: user.email });
            User.mockImplementation(() => ({
                getBy: jest.fn().mockResolvedValue(user),
            }));
            Contest.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(contest),
            }));

            await auth({ 'contest:admin': true })(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('You are not allowed to access this contest.');
        });

        test('should throw error if user is not admin and logged as team', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const user = { id: 1, email: 'test@example.com' };
            const contest = { id: 1, admin: 2 };
            jwt.verify.mockReturnValue({ user: user.email });
            User.mockImplementation(() => ({
                getBy: jest.fn().mockResolvedValue(user),
            }));
            Contest.mockImplementation(() => ({
                get: jest.fn().mockResolvedValue(contest),
            }));

            await auth({ 'contest:admin:team': true })(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('You are not allowed to access this contest.');
        });
    });

    describe('isBackground', () => {
        test('should allow access if background token is valid', async () => {
            req.headers.authorization = `Bearer ${process.env.BACKGROUND_TOKEN}`;

            await auth({ 'background': true })(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        test('should throw error if background token not provided', async () => {
            await auth({ 'background': true })(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('Token not found.');
        });

        test('should throw error if background token is invalid', async () => {
            req.headers.authorization = 'Bearer invalid_token';

            await auth({ 'background': true })(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
            expect(next.mock.calls[0][0].message).toContain('You are not allowed to access this resource.');
        });
    });

    describe('auth middleware', () => {
        test('should call next with error if no mode passes', async () => {
            await auth()(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(CustomError));
        });

        test('should call next if any mode passes', async () => {
            req.headers.authorization = 'Bearer valid_token';
            const payload = { sub: '123' };
            OAuth2Client.prototype.verifyIdToken.mockResolvedValue({ getPayload: () => payload });

            await auth({ 'user:token': true, 'user:password': true })(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });
    });
});
