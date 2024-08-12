import Table from "./components/table.js";
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
        
        const contest = new Team({ id: this.team.id, token: this.token }).getContest();
        // console.log(this.contest);

        this.showTeams(contest);
    },

    showTeams: async function(promise) {
        const frame = document.querySelector('#frame');
        frame.innerHTML += `<div id="teams-container">
            <h2>${this.translate('teams_other', 'common')}</h2>
        </div>`;

        const teamsDOM = frame.querySelector('#teams-container');
        const table = new Table({
            element: teamsDOM,
            id: 'teams', 
            columns: [
                {id: 'name', name: this.translate('name', 'common'), sort: false},
                {id: 'score', name: this.translate('score', 'common'), size: 'small'},
            ],
            translate: this.translate,
            search: false,
        });

        const {contest} = await promise;
        this.contest = contest;

        table.clear();
        // this.contest.teams.forEach(team => {
        //     if (team.author) {
        //         team.title += `<span class="author-card" title="${this.translate('problems.table.author-title', 'dashboard')}">${this.translate('problems.table.author', 'dashboard')}</span>`;
        //     }
        // });
        this.contest.teams.forEach(team => table.addItem(team));
        table.srt('score', 'desc');

        // table.addItemEvent('click', async item => {
        //     this.show(item);
        // });
    },

}