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
        let enabled = true;

        if (!isStarted && !forceReturn) {
            throw new CustomError(400, 'Contest has not started yet');
        }
        if (new Date(this.submitted_at).getTime() < contest.start_time.getTime()) {
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
        const { team, contest, remainingTime } = await this.isSubmissionEnabled();

        const data = { status };
        
        if (status !== 'ACCEPTED') {
            data.score = status == 'PARSING_ERROR' ? 0 : config.contest.penaltyScore;
            data.log = response;
            await this.update(data);
            await team.updateScore();
            return this;
        }

        // score between 80 and 100 based on the time elapsed
        const elapsedTimeRatio = remainingTime / (contest.duration * 60);
        data.score = config.contest.minScore + (config.contest.maxScore - config.contest.minScore) * elapsedTimeRatio;

        // get all teams in this contest
        const teamsInContest = await Team.getAll({ contest: contest.id });

        // check how many have been accepted before to the same problem
        const acceptedSubmissions = await Submission.getAll({
            problem: this.problem,
            team: [...teamsInContest.map(t => t.id)],
            status: 'ACCEPTED',
        });

        // bonus for the first and second accepted submission
        if (acceptedSubmissions.length === 0) {
            data.score *= 1 + config.contest.bonusScore * 2;
        }
        else if (acceptedSubmissions.length === 1) {
            data.score *= 1 + config.contest.bonusScore;
        }

        // update team score
        await this.update(data);
        await team.updateScore();
        return this;
    }
}