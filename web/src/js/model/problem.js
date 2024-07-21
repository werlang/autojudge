import Api from "../helpers/api.js";

export default class Problem {

    constructor({ id }) {
        this.id = id;
    }

    static async getAll() {
        const problems = await new Api().get('problems');
        return problems;
    }

    async get() {
        const problem = await new Api().get(`problems/${this.id}`);
        return problem;
    }
}