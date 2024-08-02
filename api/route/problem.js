import { Router } from 'express';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';
import Problem from '../model/problem.js';

const router = Router();

// TODO: add pagination when getting all problems

// create a new problem
// must be logged as user
router.post('/', auth({'user:exists': true}), async (req, res, next) => {
    try {
        if (!req.body.title) {
            throw new CustomError(400, 'Title is required.');
        }

        const problem = await new Problem({
            title: req.body.title,
            description: req.body.description || '',
            language: req.body.language || 'en',
            author: req.user.id,
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

// get all problems
// anyone can access public problems
// if author, show hidden fields
router.get('/', auth({'user:optional': true}), async (req, res, next) => {
    try {
        const problems = await Problem.getAll({});

        const problemsData = problems.map(problem => {
            const problemData = {
                id: problem.id,
                title: problem.title,
                description: problem.description,
                input: problem.input_public,
                output: problem.output_public,
            }
            if (req.user && problem.author === req.user.id) {
                problemData.inputHidden = problem.input_hidden;
                problemData.outputHidden = problem.output_hidden;
                problemData.author = true;
            }
            return problemData;
        });

        res.send({ problems: problemsData });
    }
    catch (error) {
        next(error);
    }
});

// get a problem by id
// anyone can access public problems
// if author, show hidden fields
router.get('/:id', auth({'user:optional': true}), async (req, res, next) => {
    try {
        const problem = await new Problem({ id: req.params.id }).get();

        const problemData = {
            id: problem.id,
            title: problem.title,
            description: problem.description,
            input: problem.input_public,
            output: problem.output_public,
        }
        if (req.user && problem.author === req.user.id) {
            problemData.inputHidden = problem.input_hidden;
            problemData.outputHidden = problem.output_hidden;
            problemData.author = true;
        }

        res.send({ problem: problemData });
    }
    catch (error) {
        next(error);
    }
});

// update a problem
// must be logged as user
router.put('/:id', auth({'user:exists': true}), async (req, res, next) => {
    try {
        const problem = await new Problem({ id: req.params.id }).get();
        if (problem.author !== req.user.id) {
            throw new CustomError(403, 'You are not allowed to update this problem.');
        }
        
        const data = req.body;

        data.public = data.public === 'true' || data.public === true;

        if (data.input && data.public) {
            data.input_public = data.input;
        }
        else if (data.input) {
            data.input_hidden = data.input;
        }
        
        if (data.output && data.public) {
            data.output_public = data.output;
        }
        else if (data.output) {
            data.output_hidden = data.output;
        }

        delete data.input;
        delete data.output;
        delete data.public;

        await problem.update(data);
        res.send({ 
            message: 'Problem updated.',
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


export default router;