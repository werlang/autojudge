import { Router } from 'express';
import Team from '../model/team.js';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';
import Contest from '../model/contest.js';

const router = Router();

// Create a new team
router.post('/', auth, async (req, res, next) => {
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
            message: 'Team created.',
            team: {
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
router.get('/:id', auth, async (req, res, next) => {
    try {
        const team = await new Team({ id: req.params.id }).get();
        const contest = await new Contest({ id: team.contest }).get();
        res.send({ team: {
            name: team.name,
            score: team.score,
            contest: contest.name,
        } });
    }
    catch (error) {
        next(error);
    }
});

// Update a team
router.put('/:id', auth, async (req, res, next) => {
    try {
        if (!req.body.name) {
            throw new CustomError(400, 'Name is required.');
        }
        if (req.body.score) {
            throw new CustomError(403, 'Score cannot be updated directly.');
        }
        const contest = await new Team({ id: req.params.id }).update(req.body);
        res.send({
            message: 'Team updated.',
            team: {
                name: contest.name,
                score: contest.score,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

export default router;
