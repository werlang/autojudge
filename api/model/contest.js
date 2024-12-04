import CustomError from '../helpers/error.js';
import Model from './model.js';
import Problem from './problem.js';
import Db from '../helpers/mysql.js';
import Team from './team.js';
import Submission from './submission.js';
import fs from 'fs';

export default class Contest extends Model {
    constructor({
        id,
        name,
        description,
        admin,
        duration,
        penalty_time,
        freeze_time,
    }) {
        super('contests', {
            fields: {
                id,
                name,
                description,
                admin,
                duration,
                penalty_time,
                freeze_time,
                start_time: null,
            },
            allowUpdate: ['name', 'description', 'duration', 'start_time', 'penalty_time', 'freeze_time'],
            insertFields: ['name', 'description', 'admin', 'duration', 'penalty_time', 'freeze_time'],
        });

        this.addRelation('problem', 'contest_problems', 'contest', 'problem');
    }

    static getBase64Logo(id) {
        const logoPath = `upload/contest/logo/${id}`;
        if (!fs.existsSync(logoPath)) return false;
        const file = fs.readFileSync(logoPath);
        const toString = file.toString('base64');
        return `data:image/png;base64,${toString}`;
    }

    static async getAll(filter) {
        const contests = await Model.getAll('contests', filter);
        return contests.map(contest => ({
            ...contest,
            logo: Contest.getBase64Logo(contest.id),
        }));
    }

    async get() {
        this.logo = Contest.getBase64Logo(this.id);
        return super.get();
    }

    async addProblem(problemValue) {
        if (this.isStarted()) {
            throw new CustomError(403, 'Contest has already started');
        }
        return this.insertRelation('problem', problemValue);
    }

    async getProblems() {
        let relations = await this.getRelation('problem');
        const problems = relations.map(async relation => {
            const problem = await new Problem({ id: relation.problem }).get();
            problem.order = relation.order;
            problem.color = relation.color;
            return problem;
        });
        return Promise.all(problems);
    }

    async removeProblem(problemValue) {
        if (this.isStarted()) {
            throw new CustomError(403, 'Contest has already started');
        }
        return this.deleteRelation('problem', problemValue);
    }

    async updateProblem(problemValue, data) {
        return this.updateRelation('problem', problemValue, data);
    }

    isStarted() {
        if (this.start_time === null) return false;
        return new Date(this.start_time).getTime() < Date.now();
    }

    async start() {
        if (this.isStarted()) {
            throw new CustomError(403, 'Contest has already started');
        }
        // this.start_time = Math.floor(Date.now() / 1000);
        return this.update({ start_time: Db.toDateTime(Date.now()) });
    }

    getRemainingTime(targetTime) {
        if (!this.isStarted()) return 0;
        const elapsed = this.getElapsedTime(targetTime);
        return this.duration * 60 * 1000 - elapsed;
    }

    getElapsedTime(targetTime) {
        if (!targetTime) {
            targetTime = Date.now();
        }
        targetTime = new Date(targetTime).getTime();
        if (!this.isStarted()) return 0;
        const startTime = new Date(this.start_time).getTime();
        return targetTime - startTime;
    }

    isRunning() {
        return this.isStarted() && this.getRemainingTime() > 0;
    }

    async getTeams() {
        let teams = await Team.getAll({ contest: this.id, is_active: 1 });
        return await Promise.all(teams.map(async team => {
            let solvedProblems = (await Submission.getAll({ team: team.id, status: 'ACCEPTED' })).map(s => s.problem);
            solvedProblems = solvedProblems.reduce((p,c) => p.includes(c) ? p : [...p, c], []);

            return {
                id: team.id,
                name: team.name,
                score: team.score,
                solvedProblems,
            }
        }));
    }
}