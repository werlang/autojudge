import Api from "../helpers/api.js";

export default class Problem {

    constructor({ id, title, description }) {
        this.id = id;
        this.title = title;
        this.description = description;
    }

    static async getAll() {
        const problems = await new Api().get('problems');
        return problems;
    }

    async get() {
        const problem = await new Api().get(`problems/${this.id}`);
        return problem;
    }

    async create() {
        const problem = await new Api().post('problems', {
            title: this.title,
            description: this.description
        });
        return problem;
    }

    async update(fields) {
        const problem = await new Api().put(`problems/${this.id}`, fields);
        return problem;
    }
}