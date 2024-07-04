import Model from "./model.js";

export default class Submission extends Model {
    constructor({
        id,
        team,
        problem,
        code,
    }) {
        super('submissions', {
            fields: {
                id,
                team,
                problem,
                code,
                status: null,
                submitted_at: null,
            },
            allowUpdate: ['status'],
            insertFields: ['team', 'problem', 'code'],
        });
    }
}