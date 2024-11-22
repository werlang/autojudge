import { Router } from 'express';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';
import Problem from '../model/problem.js';
import Contest from '../model/contest.js';
import Submission from '../model/submission.js';
import PDFUtils from '../helpers/pdf.js';

const router = Router();

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
            is_public: req.body.public !== false && req.body.public !== 'false',
        }).insert();
        return res.status(201).send({
            message: 'Problem created.',
            problem: {
                id: problem.id,
                hash: problem.hash.slice(-process.env.HASH_LENGTH),
                title: problem.title,
                description: problem.description,
                public: problem.is_public === 1,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// get all problems
// if author, show hidden fields
// if public or author, show public fields
// otherwise, show nothing
router.get('/', auth({'user:optional': true}), async (req, res, next) => {
    try {
        const query = {};
        const problems = await Problem.getAll(query);
        // console.log(problems);

        const problemsData = problems.map(problem => {
            const problemData = {};

            const isAuthor = req.user && problem.author === req.user.id;
            const isPublic = problem.is_public === 1;

            if (isAuthor || isPublic) {
                problemData.id = problem.id;
                problemData.title = problem.title;
                problemData.hash = problem.hash.slice(-process.env.HASH_LENGTH);
                problemData.description = problem.description;
                problemData.input = problem.input_public;
                problemData.output = problem.output_public;
                problemData.public = isPublic;
                
                if (isAuthor) {
                    problemData.inputHidden = problem.input_hidden;
                    problemData.outputHidden = problem.output_hidden;
                    problemData.author = true;
                }
            }
            
            return problemData;
        }).filter(problem => problem.id);

        res.send({ problems: problemsData });
    }
    catch (error) {
        next(error);
    }
});

// get a problem partial hash
// anyone can access public problems
// if author, show hidden fields
router.get('/:hash', auth({'user:optional': true}), async (req, res, next) => {
    try {
        if (req.params.hash.length < process.env.HASH_LENGTH) {
            throw new CustomError(400, 'Hash too short.');
        }
        const problems = await Problem.getAll({ hash: { like: req.params.hash }});
        if (problems.length == 0) {
            throw new CustomError(404, 'Problem not found.');
        }
        else if (problems.length > 1) {
            throw new CustomError(401, 'Ambiguous hash.');
        }
        const problem = problems[0];

        const problemData = {
            id: problem.id,
            hash: problem.hash.slice(-process.env.HASH_LENGTH),
            title: problem.title,
            description: problem.description,
            public: problem.is_public === 1,
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
        const toUpdate = {};

        if (data.title) {
            toUpdate.title = data.title;
        }
        if (data.description) {
            toUpdate.description = data.description;
        }

        if (data.public !== undefined) {
            toUpdate.is_public = data.public === 'true' || data.public === true;
        }

        if (data.input) {
            toUpdate.input_public = data.input;
        }
        if (data.inputHidden) {
            toUpdate.input_hidden = data.inputHidden;
        }

        if (data.output) {
            toUpdate.output_public = data.output;
        }
        if (data.outputHidden) {
            toUpdate.output_hidden = data.outputHidden;
        }

        await problem.update(toUpdate);
        res.send({ 
            message: 'Problem updated.',
            problem: {
                id: problem.id,
                hash: problem.hash.slice(-process.env.HASH_LENGTH),
                title: problem.title,
                description: problem.description,
                public: problem.is_public === 1,
            }
        });
    }
    catch (error) {
        next(error);
    }
});


// Add a new submission
// Only team members can submit
router.post('/:id/judge', [
    auth({'team:member': true}),
], async (req, res, next) => {
    try {
        const problems = await new Contest({ id: req.team.contest }).getProblems();
        if (!problems.map(p => p.id).includes(parseInt(req.params.id))) {
            throw new CustomError(404, 'Problem not found in contest.');
        }
        const problem = await new Problem({ id: req.params.id }).get();
        if (!problem.input_hidden || !problem.output_hidden) {
            throw new CustomError(403, 'Problem does not have hidden test cases');
        }

        // check if team has an accepted submission for this problem
        const submissions = await Submission.getAll({
            team: req.team.id,
            problem: req.params.id,
            status: 'ACCEPTED',
        });
        if (submissions.length > 0) {
            throw new CustomError(403, 'Team already solved this problem');
        }

        // send submission to judging queue
        const submission = await new Submission({
            team: req.team.id,
            problem: req.params.id,
            code: req.body.code,
            filename: req.body.filename,
        }).insert();
        
        res.status(201).send({
            message: 'Submission received',
            submission: {
                id: submission.id,
                status: submission.status,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// create pdf
router.post('/:hash/pdf', auth({'user:optional': true}), async (req, res, next) => {
    try {
        if (req.params.hash.length < process.env.HASH_LENGTH) {
            throw new CustomError(400, 'Hash too short.');
        }
        const problems = await Problem.getAll({ hash: { like: req.params.hash }});
        if (problems.length == 0) {
            throw new CustomError(404, 'Problem not found.');
        }
        else if (problems.length > 1) {
            throw new CustomError(401, 'Ambiguous hash.');
        }
        const problem = problems[0];

        const buffer = await new PDFUtils({
            problem,
            args: req.body,
            template: './template/pdf-index.html',
            header: './template/pdf-header.html',
            footer: './template/pdf-footer.html',
        }).create();

        res.setHeader('Content-Type', 'application/pdf');
        const normalize = text => text.toLowerCase().replace(/\s/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        res.setHeader('Content-Disposition', `attachment; filename="${normalize(problem.title)}.pdf"`);
        res.send(buffer);

    }
    catch (error) {
        next(error);
    }
});

// create pdf from multiple problems
router.post('/pdf', auth({'user:optional': true}), async (req, res, next) => {
    try {
        const hashes = req.body.problems;
        const problems = await Promise.all(hashes.map(async hash => {
            if (hash.length < process.env.HASH_LENGTH) {
                throw new CustomError(400, 'Hash too short.');
            }
            const problems = await Problem.getAll({ hash: { like: hash }});
            if (problems.length == 0) {
                throw new CustomError(404, 'Problem not found.');
            }
            else if (problems.length > 1) {
                throw new CustomError(401, 'Ambiguous hash.');
            }

            return problems[0];
        }));

        const pdfs = await Promise.all(problems.map(async problem => new PDFUtils({
            problem,
            args: req.body,
            template: './template/pdf-index.html',
            header: './template/pdf-header.html',
            footer: './template/pdf-footer.html',
        }).create()));

        const buffer = await PDFUtils.merge(pdfs);

        res.setHeader('Content-Type', 'application/pdf');
        const normalize = text => text.toLowerCase().replace(/\s/, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        res.setHeader('Content-Disposition', `attachment; filename="${normalize('problems')}.pdf"`);
        res.send(buffer);
    }
    catch (error) {
        next(error);
    }
});

export default router;
