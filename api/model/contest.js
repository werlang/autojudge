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

        this.addRelation('problem', 'contest_problems', 'contest', 'problem');
    }

    async getAll() {
        return Model.getAll('contests', { admin: this.admin });
    }

    async addProblem(problemValue) {
        return this.insertRelation('problem', problemValue);
    }

    async getProblems() {
        let problems = await this.getRelation('problem');
        problems = problems.map(async problem => new Problem({ id: problem }).get());
        return Promise.all(problems);
    }
}