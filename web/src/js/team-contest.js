import Team from "./model/team.js";

export default {
    build: async function(objects={}) {
        for (const key in objects) {
            this[key] = objects[key];
        }

        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('contest_one', 'common')} ${this.team.contest.name}</h1>
        `;

        // console.log(this.team);
        
        if (!this.contest) {
            const {contest} = await new Team({ id: this.team.id, token: this.token }).getContest();
            this.contest = contest;
        }
        console.log(this.contest);
    },

}