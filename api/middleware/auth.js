import { OAuth2Client } from 'google-auth-library';
import CustomError from "../helpers/error.js";
import User from "../model/user.js";
import Team from '../model/team.js';
import bcrypt from 'bcrypt';
import Contest from '../model/contest.js';

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
    const headers = req.headers;
    const payload = await checkToken(req);
    const user = await new User({ google_id: payload.sub }).get();
    req.user = user;
    return user;
}

async function isTeamMember(req, { id, contest }) {
    const headers = req.headers;
    if (!headers.authorization) {
        throw new CustomError(400, 'Password not found.');
    }
    const password = headers.authorization.split(' ')[1];

    if (id) {
        const team = await new Team({ id }).get();
        const isValidPassword = await bcrypt.compare(password, team.password);
        if (!isValidPassword) {
            throw new CustomError(401, 'Invalid password.');
        }
        req.team = team;
        return team;
    }
    else if (contest) {
        const teams = await new Team({ contest }).getAll();
        for (const team of teams) {
            if (await bcrypt.compare(password, team.password)) {
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

function auth({
    token, // check if the token is valid
    user, // check if the user exists (token)
    team, // check if password matches a team
    admin, // check if the user is the admin of the contest
    member, // check if the password matches a team in the contest
    adminTeam, // check if the user is the admin of the contest where the team is
}) {
    return async (req, res, next) => {
        let anyPassed = false;
        let errorList = [];

        if (token) {
            try {
                await checkToken(req);
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        if (user) {
            try {
                await checkUser(req);
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        if (admin) {
            const key = admin === true ? 'id' : admin;
            try {
                const contestId = req.params[key] || req.body[key];
                await isContestAdmin(contestId, req);
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        if (team) {
            const key = team === true ? 'id' : team;
            try {
                const teamId = req.params[key] || req.body[key];
                await isTeamMember(req, { id: teamId });
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        if (member) {
            const key = member === true ? 'id' : member;
            try {
                const contestId = req.params[key] || req.body[key];
                await isTeamMember(req, { contest: contestId });
                anyPassed = true;
            }
            catch (error) {
                errorList.push(error);
            }
        }

        if (adminTeam) {
            const key = adminTeam === true ? 'id' : adminTeam;
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

        if (!anyPassed) {
            next(new CustomError(errorList[0].code, errorList.map(error => error.message).join(' ')));
            return;
        }

        next();
    }
}

export default auth;