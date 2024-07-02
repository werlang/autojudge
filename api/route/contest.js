import { Router } from 'express';
import Contest from '../model/contest.js';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';
import Team from '../model/team.js';
import User from '../model/user.js';
import Problem from '../model/problem.js';

const router = Router();

// Create a new contest
// Only authenticated users can create contests
// POST /contests
// Request body: { name, description }
router.post('/', auth({user: true}), async (req, res, next) => {
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
                id: contest.id,
                name: contest.name,
                description: contest.description,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// Get all contests by admin
// Only authenticated users can get contests
// GET /contests
router.get('/', auth({user: true}), async (req, res, next) => {
    try {
        const contests = (await new Contest({ admin: req.user.id }).getAll()).map(contest => ({
            id: contest.id,
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
// Only authenticated users can get contests
router.get('/:id', auth({
    admin: true,
    member: true,
}), async (req, res, next) => {
    try {
        if (!req.contest) {
            req.contest = await new Contest({ id: req.params.id }).get();
        }
        let teams = await new Team({ contest: req.contest.id }).getAll();
        teams = teams.map(team => ({
            id: team.id,
            name: team.name,
            score: team.score,
        }));
        res.send({ contest: {
            id: req.contest.id,
            name: req.contest.name,
            description: req.contest.description,
            teams,
        } });
    }
    catch (error) {
        next(error);
    }
});

// Update a contest
router.put('/:id', auth({admin: true}), async (req, res, next) => {
    try {
        await req.contest.update(req.body);
        res.send({
            message: 'Contest updated.',
            contest: {
                name: req.contest.name,
                description: req.contest.description,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// Add a new existing problem to a contest
router.post('/:id/problems/:problemId', auth({admin: true}), async (req, res, next) => {
    try {
        const problem = await new Problem({ id: req.params.problemId }).get();
        await req.contest.addProblem(problem.id);
        res.send({
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
router.get('/:id/problems', auth({
    // TODO: improve auth to be more intuitive
    member: true,
    admin: true,
}), async (req, res, next) => {
    try {
        const contest = await new Contest({ id: req.params.id }).get();
        const problems = await contest.getProblems();
        // TODO: Filter which fields to show
        res.send({ problems });
    }
    catch (error) {
        next(error);
    }
});

export default router;