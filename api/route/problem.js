import { Router } from 'express';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';
import Problem from '../model/problem.js';

const router = Router();

// create a new problem
router.post('/', auth({user: true}), async (req, res, next) => {
    try {
        if (!req.body.title) {
            throw new CustomError(400, 'Title is required.');
        }
        if (!req.body.description) {
            throw new CustomError(400, 'Description is required.');
        }

        const problem = await new Problem({
            title: req.body.title,
            description: req.body.description,
            owner: req.user.id,
        }).insert();
        return res.status(201).send({
            message: 'Problem created.',
            problem: {
                id: problem.id,
                title: problem.title,
                description: problem.description,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// get a problem by id
// must be logged as user
router.get('/:id', auth({user: true}), async (req, res, next) => {
    try {
        const problem = await new Problem({ id: req.params.id }).get();
        res.send({ problem: {
            id: problem.id,
            title: problem.title,
            description: problem.description,
            // TODO: public inputs and outputs for everyone, hidden inputs and outputs and solution only for the owner
        } });
    }
    catch (error) {
        next(error);
    }
});


export default router;