import Api from "../helpers/api.js";

export default class Problem {

    constructor({ id, title, description, language }) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.language = language || 'en';
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
            description: this.description,
            language: this.language,
        });
        return problem;
    }

    async update(fields) {
        const resp = await new Api().put(`problems/${this.id}`, fields);
        const problem = await this.get();
        return { ...resp, ...problem };
    }
}