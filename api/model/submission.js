import Model from "./model.js";

export default class Submission extends Model {
    constructor({
        id,
        team,
        problem,
        code,
        filename,
    }) {
        super('submissions', {
            fields: {
                id,
                team,
                problem,
                code,
                filename,
                status: null,
                submitted_at: null,
            },
            allowUpdate: ['status'],
            insertFields: ['team', 'problem', 'code', 'filename'],
        });
    }

    static async getAll() {
        return Model.getAll('submissions');
    }
}