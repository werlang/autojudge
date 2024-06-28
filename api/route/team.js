import { Router } from 'express';
import Team from '../model/team.js';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';
import Contest from '../model/contest.js';

const router = Router();

// Create a new team
router.post('/', auth({admin: 'contest'}), async (req, res, next) => {
    try {
        if (!req.body.name) {
            throw new CustomError(400, 'Name is required.');
        }
        if (!req.body.contest) {
            throw new CustomError(400, 'Contest is required.');
        }
        
        const team = await new Team({
            name: req.body.name,
            contest: req.body.contest,
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

// Get a team by id
router.get('/:id', auth({team: true}), async (req, res, next) => {
    try {
        const contest = await new Contest({ id: req.team.contest }).get();
        res.send({ team: {
            id: req.team.id,
            name: req.team.name,
            score: req.team.score,
            contest: {
                id: contest.id,
                name: contest.name,
            }
        } });
    }
    catch (error) {
        next(error);
    }
});

// Update a team
router.put('/:id', auth({adminTeam: true}), async (req, res, next) => {
    try {
        if (!req.body.name) {
            throw new CustomError(400, 'Name is required.');
        }
        if (req.body.score) {
            throw new CustomError(403, 'Score cannot be updated directly.');
        }

        await req.team.update(req.body);
        res.send({
            message: 'Team updated.',
            team: {
                name: req.team.name,
                score: req.team.score,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// Reset team password
router.put('/:id/reset', auth({adminTeam: true}), async (req, res, next) => {
    try {
        const password = await req.team.resetPassword();
        res.send({
            message: 'Password reset.',
            team: {
                id: req.team.id,
                name: req.team.name,
                password,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

export default router;