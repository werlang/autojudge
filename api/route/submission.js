import { Router } from 'express';
import Submission from '../model/submission.js';
import Problem from '../model/problem.js';
import Runner from '../model/runner.js';

const router = Router();

// get pending submissions
router.get('/pending', async (req, res, next) => {
    try {
        const submissions = await Submission.getAll();
        res.send({ submissions: submissions.filter(s => s.status === 'PENDING') });
    }
    catch (error) {
        next(error);
    }
});

// get submission status
// Anyone can get the status of a submission
router.get('/:id', async (req, res, next) => {
    try {
        const submission = await new Submission({ id: req.params.id }).get();
        res.send({ submission: {
            id: submission.id,
            team: submission.team,
            problem: submission.problem,
            status: submission.status,
        }});
    }
    catch (error) {
        next(error);
    }
});

// call the judge to run the submission
router.post('/:id/judge', async (req, res, next) => {
    try {
        const submission = await new Submission({ id: req.params.id }).get();
        if (submission.status !== 'PENDING') {
            res.status(400).send({ message: 'Submission already judged' });
            return;
        }

        const problem = await new Problem({ id: submission.problem }).get();
        
        const input = problem.input_hidden;
        const output = problem.output_hidden;
        const code = submission.code;

        try {
            const response = await new Runner({
                format: 'json',
                filename: submission.filename,
                code,
                tests: { input, output },
            }).run();
    
            let status = 'ACCEPTED';
            if (response.failed > 0) {
                status = 'WRONG_ANSWER';
            }
    
            await submission.update({ status });
            res.send({ submission: response });
        }
        catch (error) {
            await submission.update({ status: 'PARSING_ERROR' });
            throw error;
        }
    }
    catch (error) {
        next(error);
    }
});

export default router;