import Model from './model.js';
import Problem from './problem.js';

export default class Contest extends Model {
    constructor({
        id,
        name,
        description,
        admin,
    }) {
        super('contests', {
            fields: {
                id,
                name,
                description,
                admin,
            },
            allowUpdate: ['name', 'description'],
            insertFields: ['name', 'description', 'admin'],
        });
    }

    async getAll() {
        return Model.getAll('contests', { admin: this.admin });
    }

    async addProblem(problem) {
        return this.insertRelation('contest_problems', {
            contest: this.id,
            problem,
        });
    }

    async getProblems() {
        let problems = await this.getRelation('contest_problems', { contest: this.id }, 'problem');
        problems = problems.map(async problem => new Problem({ id: problem }).get());
        return Promise.all(problems);
    }
}