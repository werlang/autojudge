import { Router } from 'express';
import Contest from '../model/contest.js';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';
import Team from '../model/team.js';
import contestProblem from './contestProblem.js';

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
        const contests = (await new Contest({ admin: req.user.id }).getAll()).map(contest => ({
            id: contest.id,
            name: contest.name,
            description: contest.description,
        }));
        res.send({ contests });
    }
    catch (error) {
        next(error);
    }
});

// Get a contest by id
// Only the contest admin or team members wich are part of the contest
router.get('/:id', auth({
    'contest:admin': true,
    'team:member': true,
}), async (req, res, next) => {
    try {
        if (!req.contest) {
            req.contest = await new Contest({ id: req.params.id }).get();
        }
        let teams = await new Team({ contest: req.contest.id }).getAll();
        teams = teams.map(team => ({
            id: team.id,
            name: team.name,
            score: team.score,
        }));
        res.send({ contest: {
            id: req.contest.id,
            name: req.contest.name,
            description: req.contest.description,
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
        await req.contest.update(req.body);
        res.send({
            message: 'Contest updated.',
            contest: {
                name: req.contest.name,
                description: req.contest.description,
            }
        });
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

// Router for problems in a contest
router.use('/:id/problems', contestProblem);

export default router;