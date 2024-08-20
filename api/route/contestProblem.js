import { Router } from 'express';
import auth from '../middleware/auth.js';
import Contest from '../model/contest.js';
import Problem from '../model/problem.js';

const router = Router({ mergeParams: true });

// Add a new existing problem to a contest
// Only the contest admin can add problems to the contest
router.post('/:problemId', auth({'contest:admin': true}), async (req, res, next) => {
    try {
        const problem = await new Problem({ id: req.params.problemId }).get();
        await req.contest.addProblem(problem.id);
        res.status(201).send({
            message: 'Problem added to contest.',
            problem: {
                id: problem.id,
                title: problem.title,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// Get all problems from a contest
// Only the contest admin can see hidden problems
// Only team members can see public problems
router.get('/', auth({
    'team:contest': true,
    'contest:admin': true,
}), async (req, res, next) => {
    try {
        const contest = await new Contest({ id: req.params.id }).get();
        const problems = await contest.getProblems();
        res.send({ problems: problems.map(problem => {
            const filteredProblem = {
                id: problem.id,
                title: problem.title,
                description: problem.description,
                input: problem.input_public,
                output: problem.output_public,
            }
            if (req.user && problem.author === req.user.id) {
                filteredProblem.inputHidden = problem.input_hidden;
                filteredProblem.outputHidden = problem.output_hidden;
            }
            return filteredProblem;
        }) });
    }
    catch (error) {
        next(error);
    }
});

// remove a problem from a contest
// Only the contest admin can remove problems from the contest
router.delete('/:problemId', auth({'contest:admin': true}), async (req, res, next) => {
    try {
        await req.contest.removeProblem(req.params.problemId);
        res.send({ message: 'Problem removed from contest.' });
    }
    catch (error) {
        next(error);
    }
});

export default router;