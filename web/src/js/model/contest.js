import Api from "../helpers/api.js";

export default class Contest {
    
    constructor({ id, name, description, duration }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.duration = duration;
    }

    static async getAll() {
        const contests = await new Api().get('contests');
        return contests;
    }

    async get() {
        const contest = await new Api().get(`contests/${this.id}`);
        return contest;
    }

    async create() {
        const contest = await new Api().post('contests', {
            name: this.name,
            description: this.description,
            duration: this.duration,
        });
        return contest;
    }

    async update(fields) {
        const resp = await new Api().put(`contests/${this.id}`, fields);
        const contest = await this.get();
        return { ...resp, ...contest };
    }

    async getProblems() {
        const {problems} = await new Api().get(`contests/${this.id}/problems`);
        return problems;
    }

    async addProblem(id) {
        const resp = await new Api().post(`contests/${this.id}/problems/${id}`);
        return resp;
    }

    async removeProblem(id) {
        const resp = await new Api().delete(`contests/${this.id}/problems/${id}`);
        return resp;
    }

    async addTeam(team) {
        const resp = await new Api().post(`contests/${this.id}/teams`, team);
        return resp;
    }
}