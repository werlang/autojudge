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
            },
            allowUpdate: ['name', 'score'],
            insertFields: ['name', 'contest', 'password'],
        });
    }

    async insert() {
        // generate new password: 6 random digits
        const password = Math.random().toString(10).slice(-6);
        // hash the password
        this.password = await bcrypt.hash(password, 10);

        // check for contest
        await new Contest({ id: this.contest }).get();

        const insert = await super.insert();
        this.password = password;
        return insert;
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
}