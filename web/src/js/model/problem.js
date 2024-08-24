import Api from "../helpers/api.js";

export default class Problem {

    constructor({ id, hash, title, description, language, isPublic }) {
        this.id = id;
        this.hash = hash;
        this.title = title;
        this.description = description;
        this.language = language || 'en';
        this.public = isPublic;
    }

    static async getAll(filter) {
        const problems = await new Api().get('problems', filter);
        return problems;
    }

    async get() {
        const problem = await new Api().get(`problems/${this.hash}`);
        return problem;
    }

    async create() {
        const problem = await new Api().post('problems', {
            title: this.title,
            description: this.description,
            language: this.language,
            public: this.public,
        });
        return problem;
    }

    async update(fields) {
        const resp = await new Api().put(`problems/${this.id}`, fields);
        this.hash = resp.problem.hash;
        const problem = await this.get();
        return { ...resp, ...problem };
    }
}