import { OAuth2Client } from 'google-auth-library';
import CustomError from "../helpers/error.js";
import User from "../model/user.js";
import Team from '../model/team.js';
import bcrypt from 'bcrypt';
import Contest from '../model/contest.js';
import jwt from 'jsonwebtoken';
import Submission from '../model/submission.js';

async function checkToken(req) {
    const headers = req.headers;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const client = new OAuth2Client();

    if (!headers.authorization) {
        throw new CustomError(400, 'Token not found.');
    }
    const token = headers.authorization.split(' ')[1];
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: clientId,
        });
        req.authPayload = ticket.getPayload();
        return req.authPayload;
    }
    catch (error) {
        throw new CustomError(401, 'Invalid token.', error.message);
    }
}

// check if the user is logged with a google token
async function checkUserGoogle(req) {
    const payload = await checkToken(req);
    const user = await new User({ google_id: payload.sub }).getBy('google_id');
    req.user = user;
    return user;
}

// authenticate the user with email and password and create a JWT token
async function authUser(req) {
    if (!req.body.email || !req.body.password) {
        throw new CustomError(400, 'Email and password are required.');
    }
    const password = req.body.password;
    const email = req.body.email;

    const createJWT = user => jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '1h' });

    let user;
    try {
        user = await new User({ email }).getBy('email');
    }
    catch (error) {
        // throw new CustomError(404, 'User not found.');
        req.user = null;
        return req.user;
    }

    // user found but has no password: google user (need to create a password)
    if (!user.password) {
        // throw new CustomError(403, 'User has no password.');
        req.user = user;
        return req.user;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (isValidPassword) {
        user.token = createJWT(user.email);
        req.user = user;
        return req.user;
    }
    else {
        throw new CustomError(401, 'Invalid password');
    }
}

// check if the user is logged with a JWT token
async function checkUserJWT(req) {
    const headers = req.headers;
    if (!headers.authorization) {
        throw new CustomError(400, 'Token not provided.');
    }
    const token = headers.authorization.split(' ')[1];

    const checkJWT = token => {
        try {
            const {user}  = jwt.verify(token, process.env.JWT_SECRET);
            return user;
        }
        catch (error) {
            return false;
        }
    }
    const jwtId = checkJWT(token);

    if (!jwtId) {
        throw new CustomError(401, 'Invalid token.');
    }
    const user = await new User({ email: jwtId }).getBy('email');
    if (jwtId && jwtId === user.email) {
        req.user = user;
        return user;
    }

    throw new CustomError(404, 'User not found.');
}

// check if the user is logged in. Works either with google token or with a password
async function checkUser(req) {
    const errorList = [];

    try {
        await checkUserGoogle(req);
        return req.user;
    }
    catch (error) {
        errorList.push(error);
    }

    try {
        await checkUserJWT(req);
        return req.user;
    }
    catch (error) {
        errorList.push(error);
    }

    throw new CustomError(401, errorList.map(error => error.message).join(' '));
}

async function authTeam(req) {
    const headers = req.headers;
    if (!headers.authorization) {
        throw new CustomError(400, 'Password not found.');
    }
    const password = headers.authorization.split(' ')[1];

    const createJWT = team => jwt.sign({ team }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // try to get the team using the id. the main mathod
    try {
        const team = await new Team({ id: req.params.id }).get();
        const isValidPassword = await bcrypt.compare(password, team.password);
        if (isValidPassword) {
            team.token = createJWT(team.id);
            req.team = team;
            return req.team;
        }
    }
    catch (error) {
    }

    // try to get the team using the hash. It must allow parts of the hash, but only should authenticate if returns a single team
    try {
        const teams = await Team.getAll({ hash: { like: req.params.id }});
        const filteredTeams = (await Promise.all(teams.map(async team => {
            const isValidPassword = await bcrypt.compare(password, team.password);
            return isValidPassword ? team : false;
        }))).filter(e => e);
        if (filteredTeams.length == 0) {
            throw new CustomError(401, 'Invalid password');
        }
        else if (filteredTeams.length > 1) {
            throw new CustomError(401, 'Ambiguous hash');
        }

        const team = filteredTeams[0];
        team.token = createJWT(team.id);
        req.team = team;
        return req.team;
    }
    catch (error) {
        throw error;
    }
}

async function checkTeam(req) {
    const headers = req.headers;
    if (!headers.authorization) {
        throw new CustomError(400, 'Token not provided.');
    }
    const token = headers.authorization.split(' ')[1];

    const checkJWT = token => {
        try {
            const {team}  = jwt.verify(token, process.env.JWT_SECRET);
            return team;
        }
        catch (error) {
            // console.log(error);
            return false;
        }
    }
    const jwtId = checkJWT(token);

    if (!jwtId) {
        throw new CustomError(401, 'Invalid token.');
    }
    const team = await new Team({ id: jwtId }).get();
    if (jwtId && jwtId === team.id) {
        req.team = team;
        return team;
    }

    throw new CustomError(404, 'Team not found.');
}

async function isTeamMember(req, context, id) {
    await checkTeam(req);

    if (context === 'id') {
        return req.team;
    }

    // context === 'contest'
    const teams = await Team.getAll({ contest: id });
    for (const team of teams) {
        if (req.team.id === team.id) {
            req.team = team;
            return team;
        }
    };

    req.team = null;
    throw new CustomError(403, 'You are not allowed to access this resource.');
}

async function isContestAdmin(contestId, req) {
    const user = await checkUser(req);
    const contest = await new Contest({ id: contestId }).get();
    if (contest.admin !== user.id) {
        throw new CustomError(403, 'You are not allowed to access this contest.');
    }
    req.contest = contest;
    return contest;
}

function isBackground(req) {
    const headers = req.headers;
    if (!headers.authorization) {
        throw new CustomError(400, 'Token not found.');
    }
    const token = headers.authorization.split(' ')[1];

    if (token !== process.env.BACKGROUND_TOKEN) {
        throw new CustomError(403, 'You are not allowed to access this resource.');
    }
    return true;
}

function auth(modes = {}) {
    
    return async (req, res, next) => {
        let anyPassed = false;
        let errorList = [];

        // check if the token is valid
        if (modes['user:token']) {
            try {
                await checkToken(req);
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        // check if the user is logging with the password
        if (modes['user:password']) {
            try {
                await authUser(req);
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        // check if the user exists (token)
        if (modes['user:exists']) {
            try {
                await checkUser(req);
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        // logged user optional
        if (modes['user:optional']) {
            anyPassed = true;
            try {
                await checkUser(req);
            }
            catch (error) {
                // do nothing
            }
        }

        // check if the user is the admin of the contest
        if (modes['contest:admin']) {
            const key = modes['contest:admin'] === true ? 'id' : modes['contest:admin'];
            try {
                const contestId = req.params[key] || req.body[key];
                await isContestAdmin(contestId, req);
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        // login with team password, receives the jwt
        if (modes['team:login']) {
            try {
                await authTeam(req);
                const contest = await new Contest({ id: req.team.contest }).get();
                const running = contest.isRunning();
                if (!running) {
                    throw new CustomError(403, 'The contest is not running');
                }
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
            
        }

        // check if the user is authenticated as a team member
        if (modes['team:exists']) {
            try {
                await checkTeam(req);
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        // check if the password matches a team (is a member of the team)
        if (modes['team:member']) {
            const key = modes['team:member'] === true ? 'id' : modes['team:member'];
            try {
                const teamId = req.params[key] || req.body[key];
                await isTeamMember(req, 'id', teamId);
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        // check if the password matches a team in the contest
        if (modes['team:contest']) {
            const key = modes['team:contest'] === true ? 'id' : modes['team:contest'];
            try {
                const contestId = req.params[key] || req.body[key];
                await isTeamMember(req, 'contest', contestId);
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        // check if the user is the owner of the submission
        if (modes['team:submission']) {
            try {
                const key = modes['team:submission'] === true ? 'id' : modes['team:submission'];
                const submissionId = req.params[key] || req.body[key];
                const submission = await new Submission({ id: submissionId }).get();
                await isTeamMember(req, 'id', submission.team);
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        // check if the user is the admin of the contest where the team is
        if (modes['contest:admin:team']) {
            const key = modes['contest:admin:team'] === true ? 'id' : modes['contest:admin:team'];
            try {
                const teamId = req.params[key] || req.body[key];
                const team = await new Team({ id: teamId }).get();
                req.team = team;
                await isContestAdmin(team.contest, req);
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        // check if the call was made by the background service
        if (modes['background']) {
            try {
                isBackground(req);
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        if (!anyPassed) {
            next(new CustomError(errorList.map(e => e.code)[0], errorList.map(error => error.message).join(' ')));
            return;
        }

        next();
    }
}

export default auth;