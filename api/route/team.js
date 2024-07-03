import { Router } from 'express';
import Team from '../model/team.js';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';
import Contest from '../model/contest.js';

const router = Router();

// Create a new team
// Only the contest admin can create teams
router.post('/', auth({'contest:admin': 'contest'}), async (req, res, next) => {
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
            message: 'Team created. Please write down the password as it will not be shown again.',
            team: {
                id: team.id,
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
// Only team members can get their own team
// Contest admin can access teams from GET /contests/:id
router.get('/:id', auth({'team:member': true}), async (req, res, next) => {
    try {
        const contest = await new Contest({ id: req.team.contest }).get();
        const team = await new Team({ id: req.team.id }).getActive();
        res.send({ team: {
            id: team.id,
            name: team.name,
            score: team.score,
            contest: {
                id: contest.id,
                name: contest.name,
            }
        } });
    }
    catch (error) {
        next(error);
    }
});

// Update a team
// Only the contest admin can update teams
router.put('/:id', auth({'contest:admin:team': true}), async (req, res, next) => {
    try {
        if (!req.body.name) {
            throw new CustomError(400, 'Name is required.');
        }
        if (req.body.score) {
            throw new CustomError(403, 'Score cannot be updated directly.');
        }

        await req.team.update(req.body);
        res.send({
            message: 'Team updated.',
            team: {
                name: req.team.name,
                score: req.team.score,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// Reset team password
// Only the contest admin can reset team passwords
router.put('/:id/reset', auth({'contest:admin:team': true}), async (req, res, next) => {
    try {
        const password = await req.team.resetPassword();
        res.send({
            message: 'Password reset.',
            team: {
                id: req.team.id,
                name: req.team.name,
                password,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// Delete a team
// Only the contest admin can delete teams
router.delete('/:id', auth({'contest:admin:team': true}), async (req, res, next) => {
    try {
        await req.team.delete();
        res.send({ message: 'Team removed.' });
    }
    catch (error) {
        next(error);
    }
});

export default router;