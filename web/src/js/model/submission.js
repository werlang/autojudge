import Api from "../helpers/api.js";

export default class Submission {

    constructor({ id, token }) {
        this.id = id;
        this.token = token;
    }

    async get() {
        const submission = await new Api({ token: this.token }).get(`submissions/${this.id}`);
        return submission;
    }

    async getAll() {
        const submissions = await new Api({ token: this.token }).get(`submissions`);
        return submissions;
    }

    async updateStatus(status) {
        const submission = await new Api().put(`submissions/${this.id}/status`, { status });
        return submission;
    }

}