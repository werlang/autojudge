import CustomError from '../helpers/error.js';
import Model from './model.js';
import Problem from './problem.js';
import Db from '../helpers/mysql.js';

export default class Contest extends Model {
    constructor({
        id,
        name,
        description,
        admin,
        duration,
    }) {
        super('contests', {
            fields: {
                id,
                name,
                description,
                admin,
                duration,
                started_at: null,
            },
            allowUpdate: ['name', 'description', 'duration', 'started_at'],
            insertFields: ['name', 'description', 'admin', 'duration'],
        });

        this.addRelation('problem', 'contest_problems', 'contest', 'problem');
    }

    async getAll() {
        return Model.getAll('contests', { admin: this.admin });
    }

    async addProblem(problemValue) {
        if (this.isStarted()) {
            throw new CustomError(403, 'Contest has already started');
        }
        return this.insertRelation('problem', problemValue);
    }

    async getProblems() {
        let problems = await this.getRelation('problem');
        problems = problems.map(async problem => new Problem({ id: problem }).get());
        return Promise.all(problems);
    }

    async removeProblem(problemValue) {
        if (this.isStarted()) {
            throw new CustomError(403, 'Contest has already started');
        }
        return this.deleteRelation('problem', problemValue);
    }

    isStarted() {
        if (this.started_at === null) return false;
        return new Date(this.started_at * 1000) < Date.now();
    }

    async start() {
        if (this.isStarted()) {
            throw new CustomError(403, 'Contest has already started');
        }
        // this.started_at = Math.floor(Date.now() / 1000);
        return this.update({ started_at: Db.toDateTime(Date.now()) });
    }

    getRemainingTime() {
        if (!this.isStarted()) return 0;
        const startedAt = new Date(this.started_at * 1000);
        const now = Date.now();
        const elapsed = (now - startedAt) / 1000;
        return this.duration * 60 - elapsed;
    }
}