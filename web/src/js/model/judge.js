import Api from "../helpers/api.js";
import Team from "./team.js";

export default class Judge {

    constructor({ problem, code, filename }) {
        this.problem = problem;
        this.code = code;
        this.filename = filename;
    }

    async run() {
        return await new Api({ token: Team.getToken() }).post(`problems/${this.problem}/judge`, {
            code: this.code,
            filename: this.filename,
        });
    }
}