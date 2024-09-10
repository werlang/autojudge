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
                start_time: null,
            },
            allowUpdate: ['name', 'description', 'duration', 'start_time'],
            insertFields: ['name', 'description', 'admin', 'duration'],
        });

        this.addRelation('problem', 'contest_problems', 'contest', 'problem');
    }

    static async getAll(filter) {
        return Model.getAll('contests', filter);
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
        if (!targetTime) {
            targetTime = Date.now();
        }
        targetTime = new Date(targetTime).getTime();
        if (!this.isStarted()) return 0;
        const startTime = new Date(this.start_time).getTime();
        const elapsed = Math.floor((targetTime - startTime) / 1000);
        return this.duration * 60 - elapsed;
    }

    isRunning() {
        return this.isStarted() && this.getRemainingTime() > 0;
    }
}