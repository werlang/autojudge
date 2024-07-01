import Contest from './contest.js';
import Model from './model.js';
import bcrypt from 'bcrypt';

export default class Team extends Model {
    constructor({
        id,
        name,
        contest,
        password,
    }) {
        super('teams', {
            fields: {
                id,
                created_at: null,
                name,
                contest,
                password,
                score: null,
                is_active: null,
            },
            allowUpdate: ['name', 'score', 'password', 'is_active'],
            insertFields: ['name', 'contest'],
        });
    }

    async insert() {
        // check for contest
        await new Contest({ id: this.contest }).get();
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

    async getAll() {
        return Model.getAll('teams', { contest: this.contest });
    }

    async setScore(score) {
        if (score < 0) {
            throw new CustomError(400, 'Score must be a positive number.');
        }
        return this.update({ score });
    }

    async delete() {
        return this.update({ is_active: 0 });
    }

    async getActive() {
        return super.getBy('id', { is_active: 1 });
    }
}