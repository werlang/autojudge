import { Router } from 'express';
import Submission from '../model/submission.js';

const router = Router();

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

export default router;