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
            },
            allowUpdate: ['status', 'score'],
            insertFields: ['team', 'problem', 'code', 'filename'],
        });
    }

    static async getAll(filter) {
        return Model.getAll('submissions', filter);
    }

    async isSubmissionEnabled() {
        const team = await new Team({ id: this.team }).get();
        const contest = await new Contest({ id: team.contest }).get();
        const isStarted = contest.isStarted();
        const remainingTime = contest.getRemainingTime();

        if (!isStarted) {
            throw new CustomError(400, 'Contest has not started yet.');
        }
        if (remainingTime <= 0){
            throw new CustomError(400, 'Contest has ended.');
        }

        return {
            enabled: true,
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

    async updateStatus(status) {
        const { team, contest, remainingTime } = await this.isSubmissionEnabled();

        const data = { status };
        
        if (status !== 'ACCEPTED') {
            data.score = config.contest.penaltyScore;
            team.setScore(team.score + data.score);
            return this.update(data);
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
        team.setScore(team.score + data.score);

        return this.update(data);
    }
}