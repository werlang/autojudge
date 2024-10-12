import { Router } from 'express';
import Contest from '../model/contest.js';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';
import Team from '../model/team.js';
import contestProblem from './contestProblem.js';
import config from '../helpers/config.js';
import Submission from '../model/submission.js';
import PDFUtils from '../helpers/pdf.js';
import fs from 'fs';

const router = Router();

// Create a new contest
// Only authenticated users can create contests
// POST /contests
// Request body: { name, description }
router.post('/', auth({'user:exists': true}), async (req, res, next) => {
    try {
        if (!req.body.name) {
            throw new CustomError(400, 'Name is required.');
        }
        const contest = await new Contest({
            name: req.body.name,
            description: req.body.description,
            duration: req.body.duration || config.contest.duration,
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
router.get('/', auth({'user:exists': true}), async (req, res, next) => {
    try {
        const contests = await Promise.all((await Contest.getAll({ admin: req.user.id })).map(async contest => {
            let teams = Team.getAll({ contest: contest.id, is_active: 1 });
            let problems = new Contest({ id: contest.id }).getProblems();

            return {
                id: contest.id,
                name: contest.name,
                description: contest.description,
                duration: contest.duration,
                startTime: contest.start_time,
                logo: contest.logo,
                teams: (await teams).length,
                problems: (await problems).length,
            }
        }));
        res.send({ contests });
    }
    catch (error) {
        next(error);
    }
});

// Get a contest by id
// Only the contest admin or team members in contest can get the contest
router.get('/:id', auth({
    'contest:admin': true,
    'team:contest': true,
}), async (req, res, next) => {
    try {
        if (!req.contest) {
            req.contest = await new Contest({ id: req.params.id }).get();
        }
        
        const teams = await req.contest.getTeams();
        const contest = new Contest({ id: req.contest.id });
        let problems = await contest.getProblems();
        problems = await Promise.all(problems.map(async problem => {
            return {
                id: problem.id,
                title: problem.title,
                hash: problem.hash.slice(-process.env.HASH_LENGTH),
                color: problem.color,
                order: problem.order,
            }
        }));

        res.send({ contest: {
            id: req.contest.id,
            name: req.contest.name,
            description: req.contest.description,
            duration: req.contest.duration,
            startTime: req.contest.start_time,
            logo: req.contest.logo,
            teams,
            problems,
        } });
    }
    catch (error) {
        next(error);
    }
});

// Update a contest
// Only the contest admin can update the contest
router.put('/:id', auth({'contest:admin': true}), async (req, res, next) => {
    try {
        if (req.contest.isStarted()) {
            throw new CustomError(400, 'Contest has already started');
        }
        await req.contest.update({
            name: req.body.name,
            description: req.body.description,
            duration: req.body.duration,
        });
        res.send({
            message: 'Contest updated.',
            contest: {
                name: req.contest.name,
                description: req.contest.description,
                duration: req.contest.duration,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// Update a contest logo
router.post('/:id/logo', auth({'contest:admin': true}), async (req, res, next) => {
    try {
        if (!req.body.logo) {
            throw new CustomError(400, 'Logo is required.');
        }
        
        const base64Data = req.body.logo.replace(/^data:image\/\w+;base64,/, '');
        const dir = `upload/contest/logo/`;
        const filename = `${dir}${req.contest.id}.png`;

        // Ensure the directory exists
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filename, base64Data, 'base64');

        res.send({ message: 'Logo updated.' });
    }
    catch (error) {
        next(error);
    }
});

// start a contest
router.put('/:id/start', auth({'contest:admin': true}), async (req, res, next) => {
    try {
        await req.contest.start();
        res.send({ message: 'Contest started.' });
    }
    catch (error) {
        next(error);
    }
});

// reset a contest
router.put('/:id/reset', auth({'contest:admin': true}), async (req, res, next) => {
    try {
        await req.contest.update({ start_time: null });

        let teams = await Team.getAll({ contest: req.contest.id });
        teams.forEach(async team => {
            new Team({ id: team.id }).update({ score: 0 });
            let submissions = await Submission.getAll({
                team: team.id,
            });
            submissions.forEach(async submission => {
                new Submission({ id: submission.id }).delete();
            });
        });

        res.send({ message: 'Contest reset.' });
    }
    catch (error) {
        next(error);
    }
});

// Create a new team
// Only the contest admin can create teams
router.post('/:id/teams', auth({'contest:admin': true}), async (req, res, next) => {
    try {
        if (!req.body.name) {
            throw new CustomError(400, 'Name is required.');
        }
        
        const team = await new Team({
            name: req.body.name,
            contest: req.contest.id,
        }).insert();
        return res.status(201).send({
            message: 'Team created. Please write down the password as it will not be shown again.',
            team: {
                id: team.id,
                hash: team.hash.slice(-process.env.HASH_LENGTH),
                name: team.name,
                password: team.password,
            }
        });
    }
    catch (error) {
        next(error);
    }
});

// Get all submissions for a contest
// Only the contest admin can get submissions
router.get('/:id/submissions', auth({'contest:admin': true}), async (req, res, next) => {
    try {
        const teams = await Team.getAll({ contest: req.contest.id });
        const submissions = await Submission.getAll({ team: teams.map(team => team.id) });
        res.send({ submissions: submissions.map(submission => ({
            id: submission.id,
            team: submission.team,
            problem: submission.problem,
            submittedAt: submission.submitted_at,
            status: submission.status,
            score: submission.score,
            code: submission.code,
            filename: submission.filename,
            log: submission.log,
        })) });
    }
    catch (error) {
        next(error);
    }
});

// create pdf
router.post('/:id/pdf', auth({'contest:admin': true}), async (req, res, next) => {
    try {
        const contest = new Contest({ id: req.contest.id });
        await contest.get();
        let problems = await contest.getProblems();
        // res.send(problems);
        // return;

        const pdfs = await Promise.all(problems.map(async problem => new PDFUtils({
            problem,
            args: {
                ...req.body,
                'header.title': contest.name,
                'header.subtitle': contest.description,
                'custom-logo': contest.logo,
            },
            template: './template/pdf-index.html',
            header: './template/pdf-header.html',
            footer: './template/pdf-footer.html',
        }).create()));

        const buffer = await PDFUtils.merge(pdfs);

        res.setHeader('Content-Type', 'application/pdf');
        const normalize = text => text.toLowerCase().replace(/\s/, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        res.setHeader('Content-Disposition', `attachment; filename="${normalize(contest.name)}.pdf"`);
        res.send(buffer);
    }
    catch (error) {
        next(error);
    }
});

// Router for problems in a contest
router.use('/:id/problems', contestProblem);

export default router;