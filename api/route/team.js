import { Router } from 'express';
import Team from '../model/team.js';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';
import Contest from '../model/contest.js';


const router = Router();

// Login a team
// Only team members can login
router.post('/:id/login', auth({'team:login': true}), async (req, res, next) => {
    try {
        const token = await req.team.login();
        res.send({ token });
    }
    catch (error) {
        next(error);
    }
});

// Get a team by id
// Only team members can get their own team
// Contest admin can access teams from GET /contests/:id
router.get('/', auth({'team:member': true}), async (req, res, next) => {
    try {
        const contest = await new Contest({ id: req.team.contest }).get();
        const team = await new Team({ id: req.team.id }).getActive();
        res.send({ team: {
            id: team.id,
            hash: team.hash,
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
                hash: req.team.hash,
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