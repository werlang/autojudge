import CustomError from '../helpers/error.js';
import Contest from './contest.js';
import Model from './model.js';
import bcrypt from 'bcrypt';
import Submission from './submission.js';
import { v4 as uuidv4 } from 'uuid';

export default class Team extends Model {
    constructor({
        id,
        hash,
        name,
        contest,
        password,
    }) {
        super('teams', {
            fields: {
                id,
                hash,
                created_at: null,
                name,
                contest,
                password,
                score: null,
                is_active: null,
            },
            allowUpdate: ['name', 'score', 'password', 'is_active'],
            insertFields: ['name', 'contest', 'hash'],
        });
    }

    static async getAll(filter) {
        return Model.getAll('teams', filter);
    }

    async get() {
        if (this.id) {
            return super.get();
        }
        else if (this.hash) {
            return super.getBy('hash');
        }

        throw new CustomError(400, 'ID or hash is required');
    }

    async insert() {
        // check for contest
        const contest = await new Contest({ id: this.contest }).get();
        if (contest.isStarted()) {
            throw new CustomError(403, 'Contest has already started');
        }
        this.hash = uuidv4().replace(/-/g, '');
        const insert = await super.insert();
        await this.resetPassword();
        return insert;
    }

    async resetPassword() {
        const newPassword = Math.random().toString(10).slice(-6);
        await this.update({ password: await bcrypt.hash(newPassword, 10) });
        this.password = newPassword;
        return newPassword;
    }

    async updateScore() {
        // get all submissions
        const submissions = await Submission.getAll({ team: this.id });
        // calculate score
        const score = submissions.reduce((acc, submission) => acc + parseFloat(submission.score), 0);
        return this.update({ score });
    }

    async delete() {
        return this.update({ is_active: 0 });
    }

    async getActive() {
        return super.getBy('id', { is_active: 1 });
    }
}