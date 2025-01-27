import Model from './model.js';

export default class Contest extends Model {

    constructor(fields, token = 'valid_token') {
        super(fields, '/contests', token);
        this.entity = 'contest';
    }

    static async getAll(token = 'valid_token') {
        return new Model({}, '/contests', token).call('/', 'GET');
    }

    async insert(data) {
        const res = await this.call('/', 'POST', data);
        if (res.body[this.entity]) {
            this.updateAttributes(res.body[this.entity]);
        }
        return this;
    }

    async get() {
        const res = await this.call(`/${this.id}`, 'GET');
        if (res.body[this.entity]) {
            this.updateAttributes(res.body[this.entity]);
        }
        return this;
    }

    async update(data) {
        const res = await this.call(`/${this.id}`, 'PUT', data);
        if (res.body[this.entity]) {
            this.updateAttributes(res.body[this.entity]);
        }
        return this;
    }

    async updateLogo(data) {
        const res = await this.call(`/${this.id}/logo`, 'POST', { logo: data});
        return this;
    }

    async start() {
        const res = await this.call(`/${this.id}/start`, 'PUT');
        return this;
    }

    async addProblem(problemId) {
        await this.call(`/${this.id}/problems/${problemId}`, 'POST');
        return this;
    }

    async getProblems() {
        const problems = await this.call(`/${this.id}/problems`, 'GET');
        if (problems.body.problems) {
            this.problems = problems.body.problems;
        }
        return this;
    }

    async removeProblem(problemId) {
        await this.call(`/${this.id}/problems/${problemId}`, 'DELETE');
        return this;
    }

    async updateProblem(problemId, data) {
        await this.call(`/${this.id}/problems/${problemId}`, 'PUT', data);
        return this;
    }

    async unlock() {
        await this.call(`/${this.id}/unlock`, 'PUT');
        return this;
    }

    async insertTeam(data) {
        await this.call(`/${this.id}/teams`, 'POST', data);
        return this;
    }

    async reset() {
        await this.call(`/${this.id}/reset`, 'PUT');
        return this;
    }

    async getPdf() {
        const res = await this.call(`/${this.id}/pdf`, 'POST');
        if (res.body) {
            this.pdf = res.body;
        }
        return this;
    }

    async getSubmissions() {
        const submissions = await this.call(`/${this.id}/submissions`, 'GET');
        if (submissions.body.submissions) {
            this.submissions = submissions.body.submissions;
        }
        return this;
    }

}