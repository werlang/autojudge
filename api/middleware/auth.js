import { OAuth2Client } from 'google-auth-library';
import CustomError from "../helpers/error.js";
import User from "../model/user.js";
import Team from '../model/team.js';
import bcrypt from 'bcrypt';
import Contest from '../model/contest.js';
import jwt from 'jsonwebtoken';

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

async function checkUser(req) {
    const payload = await checkToken(req);
    const user = await new User({ google_id: payload.sub }).get();
    req.user = user;
    return user;
}

async function authTeam(req) {
    const headers = req.headers;
    if (!headers.authorization) {
        throw new CustomError(400, 'Password not found.');
    }
    const password = headers.authorization.split(' ')[1];

    const team = await new Team({ id: req.params.id }).get();
    const isValidPassword = await bcrypt.compare(password, team.password);
    if (!isValidPassword) {
        throw new CustomError(401, 'Invalid password.');
    }
    return jwt.sign({ team: team.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function isTeamMember(req, context, id) {
    const headers = req.headers;
    if (!headers.authorization) {
        throw new CustomError(400, 'Password not found.');
    }
    const password = headers.authorization.split(' ')[1];

    const checkJWT = password => {
        try {
            const {team}  = jwt.verify(password, process.env.JWT_SECRET);
            return team;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
    const jwtId = checkJWT(password);

    if (context === 'id') {
        const team = await new Team({ id }).get();
        if (jwtId && jwtId === team.id) {
            req.team = team;
            return team;
        }
    }
    else if (context === 'contest') {
        const teams = await Team.getAll({ contest: id });
        for (const team of teams) {
            if (jwtId && jwtId === team.id) {
                req.team = team;
                return team;
            }
        };
    }

    throw new CustomError(401, 'Invalid password.');
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
                const token = await authTeam(req);
                res.send({ token });
                return;
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
            next(new CustomError(errorList[0].code, errorList.map(error => error.message).join(' ')));
            return;
        }

        next();
    }
}

export default auth;