import config from "../helpers/config.js";
import CustomError from "../helpers/error.js";
import Contest from "./contest.js";
import Model from "./model.js";
import Team from "./team.js";

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
                score: null,
                log: null,
            },
            allowUpdate: ['status', 'score', 'log'],
            insertFields: ['team', 'problem', 'code', 'filename'],
        });
    }

    static async getAll(filter) {
        return Model.getAll('submissions', filter);
    }

    async isSubmissionEnabled(forceReturn = false) {
        const team = await new Team({ id: this.team }).get();
        const contest = await new Contest({ id: team.contest }).get();
        const isStarted = contest.isStarted();
        const remainingTime = contest.getRemainingTime(this.submitted_at);
        const elapsedTime = contest.getElapsedTime(this.submitted_at);
        let enabled = true;

        if (!isStarted && !forceReturn) {
            throw new CustomError(400, 'Contest has not started yet');
        }
        if (this.submitted_at && new Date(this.submitted_at).getTime() < contest.start_time.getTime()) {
            throw new CustomError(400, 'Submission is before contest start time');
        }
        if (remainingTime <= 0 && !forceReturn){
            throw new CustomError(400, 'Contest has ended');
        }

        // if forceReturn and some error occurs, return the data anyway
        if (!isStarted || remainingTime <= 0) {
            enabled = false;
        }

        return {
            enabled,
            isStarted,
            elapsedTime,
            remainingTime,
            team,
            contest,
        };
    }

    async insert() {
        await this.isSubmissionEnabled();
        return super.insert();
    }

    async updateStatus(response) {
        const status = response.status;
        const { team, elapsedTime } = await this.isSubmissionEnabled();

        const data = {
            status,
            score: elapsedTime,
        };
        
        if (status !== 'ACCEPTED') {
            data.score = status == 'PARSING_ERROR' ? 0 : config.contest.penaltyTime * 60 * 1000;
            data.log = response;
            await this.update(data);
            await team.updateScore();
            return this;
        }

        // update team score
        await this.update(data);
        await team.updateScore();
        return this;
    }
}