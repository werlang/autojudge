import { Router } from 'express';
import Contest from '../model/contest.js';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';

const router = Router();

// Create a new contest
router.post('/', auth, async (req, res, next) => {
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
                name: contest.name,
                description: contest.description,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// Get all contests
router.get('/', auth, async (req, res, next) => {
    try {
        const contests = (await Contest.getAll()).map(contest => ({
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
router.get('/:id', auth, async (req, res, next) => {
    try {
        const contest = await new Contest({ id: req.params.id }).get();
        res.send({ contest: {
            name: contest.name,
            description: contest.description,
        } });
    }
    catch (error) {
        next(error);
    }
});

// Update a contest
router.put('/:id', auth, async (req, res, next) => {
    try {
        const contest = await new Contest({ id: req.params.id }).update(req.body);
        res.send({
            message: 'Contest updated.',
            contest: {
                name: contest.name,
                description: contest.description,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

export default router;