import { Router } from 'express';
import Contest from '../model/contest.js';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';
import Team from '../model/team.js';
import contestProblem from './contestProblem.js';
import config from '../helpers/config.js';
import Submission from '../model/submission.js';

const router = Router();

// Create a new contest
// Only authenticated users can create contests
// POST /contests
// Request body: { name, description }
router.post('/', auth({'user:exists': true}), async (req, res, next) => {
    try {
        if (!req.body.name) {
            throw new CustomError(400, 'Name is required.');
        }
        const contest = await new Contest({
            name: req.body.name,
            description: req.body.description,
            duration: req.body.duration || config.contest.duration,
            admin: req.user.id,
        }).insert();
        return res.status(201).send({
            message: 'Contest created.',
            contest: {
                id: contest.id,
                name: contest.name,
                description: contest.description,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// Get all contests by admin
// Only authenticated users can get contests
// GET /contests
router.get('/', auth({'user:exists': true}), async (req, res, next) => {
    try {
        const contests = await Promise.all((await Contest.getAll({ admin: req.user.id })).map(async contest => {
            let teams = await Team.getAll({ contest: contest.id });

            return {
                id: contest.id,
                name: contest.name,
                description: contest.description,
                duration: contest.duration,
                startTime: contest.start_time,
                teams: teams.length,
            }
        }));
        res.send({ contests });
    }
    catch (error) {
        next(error);
    }
});

// Get a contest by id
// Only the contest admin or team members in contest can get the contest
router.get('/:id', auth({
    'contest:admin': true,
    'team:contest': true,
}), async (req, res, next) => {
    try {
        if (!req.contest) {
            req.contest = await new Contest({ id: req.params.id }).get();
        }
        let teams = await Team.getAll({ contest: req.contest.id });
        teams = teams.map(team => ({
            id: team.id,
            name: team.name,
            score: team.score,
        }));
        res.send({ contest: {
            id: req.contest.id,
            name: req.contest.name,
            description: req.contest.description,
            duration: req.contest.duration,
            startTime: req.contest.start_time,
            maxScore: config.contest.maxScore,
            minScore: config.contest.minScore,
            bonusScore: config.contest.bonusScore,
            teams,
        } });
    }
    catch (error) {
        next(error);
    }
});

// Update a contest
// Only the contest admin can update the contest
router.put('/:id', auth({'contest:admin': true}), async (req, res, next) => {
    try {
        await req.contest.update({
            name: req.body.name,
            description: req.body.description,
            duration: req.body.duration,
        });
        res.send({
            message: 'Contest updated.',
            contest: {
                name: req.contest.name,
                description: req.contest.description,
                duration: req.contest.duration,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// start a contest
router.put('/:id/start', auth({'contest:admin': true}), async (req, res, next) => {
    try {
        await req.contest.start();
        res.send({ message: 'Contest started.' });
    }
    catch (error) {
        next(error);
    }
});

// Create a new team
// Only the contest admin can create teams
router.post('/:id/teams', auth({'contest:admin': true}), async (req, res, next) => {
    try {
        if (!req.body.name) {
            throw new CustomError(400, 'Name is required.');
        }
        
        const team = await new Team({
            name: req.body.name,
            contest: req.contest.id,
        }).insert();
        return res.status(201).send({
            message: 'Team created. Please write down the password as it will not be shown again.',
            team: {
                id: team.id,
                name: team.name,
                password: team.password,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// get information about all accepted submissions in the contest
router.get('/:id/submissions/accepted', auth({'team:contest': true}), async (req, res, next) => {
    try {
        const contest = await new Contest({ id: req.params.id }).get();
        const teamsInContest = await Team.getAll({ contest: contest.id });

        let submissions = await Submission.getAll({
            team: [...teamsInContest.map(t => t.id)],
            status: 'ACCEPTED',
        });
        submissions = submissions.map(submission => ({
            id: submission.id,
            team: submission.team,
            problem: submission.problem,
            score: submission.score,
            submittedAt: submission.submitted_at,
        }));
        res.send({ submissions });
    }
    catch (error) {
        next(error);
    }
});

// Router for problems in a contest
router.use('/:id/problems', contestProblem);

export default router;