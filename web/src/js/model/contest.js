import Api from "../helpers/api.js";
import Team from "./team.js";

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

    async get(logAsTeam=false) {
        const args = {};
        if (logAsTeam) {
            args.token = Team.getToken();
        }
        const contest = await new Api(args).get(`contests/${this.id}`);
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

    async getProblems(logAsTeam=false) {
        const args = {};
        if (logAsTeam) {
            args.token = Team.getToken();
        }
        const {problems} = await new Api(args).get(`contests/${this.id}/problems`);
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
}