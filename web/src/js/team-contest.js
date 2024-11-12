import Table from "./components/table.js";
import Team from "./model/team.js";
import createClock from "./components/contest-clock.js";

export default {
    build: async function() {
        // console.log(this.team);
        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            ${ this.team.contest.logo ? 
                `<div id="logo-container">
                    <img src="${this.team.contest.logo}" alt="${this.team.contest.name}">
                </div>` : ''
            }
            <h1>${this.translate('contest_one', 'common')} ${this.team.contest.name}</h1>
            <p id="contest-description">${this.team.contest.description}</p>
            <div id="time-left"></div>
        `;

        // console.log(this.team);
        this.showTeams();
    },

    showTeams: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML += `<div id="teams-container">
            <h2>${this.translate('teams_other', 'common')}</h2>
        </div>`;

        const teamsDOM = frame.querySelector('#teams-container');
        const table = new Table({
            element: teamsDOM,
            id: 'teams', 
            columns: [
                {id: 'score', name: this.translate('time', 'common'), sort: false, size: 'small'},
                {id: 'name', name: this.translate('name', 'common'), sort: false, escapeHTML: true},
                {id: 'solved', name: this.translate('solved', 'common'), sort: false},
            ],
            translate: this.translate,
            search: false,
        });

        this.updateTeams(table);
    },
    
    async updateTeams(table) {
        const resp = await new Team({ id: this.team.id }).getContest().catch(() => location.reload());
        this.contest = resp.contest;
        createClock(document.querySelector('#time-left'), {
            contest: this.contest,
            translate: this.translate,
        });
        // console.log(this.contest);

        table.clear();
        this.contest.teams.map(team => {
            const colors = this.contest.problems.filter(p => team.solvedProblems.includes(p.id)).map(p => p.color);
            const colorBadges = colors.map(color => `<div class="color" style="--color-problem: ${color}"></div>`);

            return {
                name: team.name,
                score: `<span>${(parseFloat(team.score) / 1000 / 60).toFixed(2)}</span>`,
                scoreSort: team.solvedProblems.length * 1e9 - team.score,
                solved: colorBadges.join(''),
            }
        }).forEach(team => table.addItem(team));
        table.srt('scoreSort', 'desc');

        if (this.refresh) {
            if (this.updateTimeout) clearTimeout(this.updateTimeout);
            this.updateTimeout = setTimeout(() => this.updateTeams(table), 5000);
        }
    },
}