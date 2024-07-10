import { Router } from 'express';
import Submission from '../model/submission.js';
import Problem from '../model/problem.js';
import Request from '../helpers/request.js';
import auth from '../middleware/auth.js';

const router = Router();

// get pending submissions
// the background service is supposed to call this endpoint. it will show all pending submissions from all contests
router.get('/pending', auth({'background': true}), async (req, res, next) => {
    try {
        let submissions = await Submission.getAll({
            status: 'PENDING',
        });
        // remove submissions from contests that are not started or have ended
        submissions = await Promise.all(submissions.map(async submission => {
            const enabled = await new Submission({ id: submission.id }).get().then(s => s.isSubmissionEnabled(true));
            return enabled.enabled ? submission : null;
        }));
        submissions = submissions.filter(submission => submission !== null);
        res.send({ submissions });
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
            score: submission.score,
            submittedAt: submission.submitted_at,
        }});
    }
    catch (error) {
        next(error);
    }
});

// call the judge to run the submission
// only the background service can call this endpoint
router.post('/:id/judge', auth({'background': true}), async (req, res, next) => {
    try {
        const submission = await new Submission({ id: req.params.id }).get();
        if (submission.status !== 'PENDING') {
            res.status(400).send({ message: 'Submission already judged' });
            return;
        }
        await submission.isSubmissionEnabled();

        const problem = await new Problem({ id: submission.problem }).get();
        
        const input = problem.input_hidden;
        const output = problem.output_hidden;
        const code = submission.code;

        const request = new Request({ url: `http://judge:3000` });
        const response = await request.post('', {
            format: 'json',
            filename: submission.filename,
            code,
            tests: { input, output },
        });

        response.status = 'ACCEPTED';
        // this is the TLE check for the entire process. the autojudge script itself
        if (response.error && response.error === 'TLE') {
            response.status = 'TIME_LIMIT_EXCEEDED';
        }
        // if the response do not return a valid json, it is a parsing error
        else if (response.failed === undefined) {
            response.status = 'PARSING_ERROR';
        }
        else if (response.failed > 0) {
            // this checks if the timeout inside the autojudge script was triggered
            if (response.results.find(r => r.status === 'TLE')) {
                response.status = 'TIME_LIMIT_EXCEEDED';
            }
            if (response.results.find(r => r.status === 'RTE')) {
                response.status = 'ERROR';
            }
            else {
                response.status = 'WRONG_ANSWER';
            }
        }

        await submission.updateStatus(response.status);
        res.send({ submission: response });
    }
    catch (error) {
        next(error);
    }
});

export default router;