import Modal from "./components/modal.js";
import Table from "./components/table.js";
import Toast from "./components/toast.js";
import Contest from "./model/contest.js";
import Team from "./model/team.js";

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('contest_one', 'common')} ${this.contest.name}</h1>
            <p id="contest-description"></p>
            <div id="time-left"></div>
        `;

        // console.log(this.contest);
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
                {id: 'name', name: this.translate('name', 'common'), sort: false},
                {id: 'solved', name: this.translate('solved', 'common'), sort: false},
            ],
            controls: [
                { id: 'reset', icon: 'fas fa-redo-alt', title: this.translate('teams.reset-title', 'contest'), action: s => this.resetPassword(s) },
                { id: 'rename', icon: 'fas fa-edit', title: this.translate('teams.rename-title', 'contest'), action: s => this.renameTeam(s) },
            ],
            selection: true,
            translate: this.translate,
            search: false,
        });

        table.addItemEvent('click', item => {
            const selected = table.getSelected();
            const toEnable = [];

            if (selected.length) {
                toEnable.push('reset', 'rename');
            }
            table.disableControl('reset', 'rename');
            table.enableControl(...toEnable);
        });
        table.disableControl('reset', 'rename');

        this.updateTeams(table);
    },
    
    async updateTeams(table) {
        const {contest} = await new Contest({ id: this.contest.id }).get();
        this.contest = contest;
        // console.log(contest);

        table.clear();
        this.contest.teams.map(team => {
            const colors = this.contest.problems.filter(p => team.solvedProblems.includes(p.id)).map(p => p.color);
            const colorBadges = colors.map(color => `<div class="color" style="--color-problem: ${color}"></div>`);

            return {
                id: team.id,
                name: team.name,
                score: `<span>${(parseFloat(team.score) / 1000 / 60).toFixed(2)}</span>`,
                // 1: number of solved problems. 2: lowest time of solved problems.
                // number of solved problems * (big number) makes the problems solved to be the most important sorting criteria
                // the score is subtracted to make a higher time score to decrease the scoreSort. But it will never be enough to offset the solved problems
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

    resetPassword: async function(selected) {
        if (selected.length === 0) return;
        
        const team = await new Team({ id: selected[0].id }).resetPassword().catch(() => location.reload());
        new Toast(this.translate('teams.reset-success', 'contest', {count: 1}), { type: 'success' });

        this.modalResetPassword(team);
        this.build();
    },

    modalResetPassword: async function(team) {
        // console.log(team);
        
        const modal = new Modal(`
            <h1>${this.translate('teams_one', 'common')} ${team.name}</h1>
            <p>${this.translate('add-team.message-1', 'contest')}</p>
            <pre id="password">
                <code>${team.password}</code>
                <div class="copy" title="${this.translate('copy', 'common')}"><i class="fas fa-copy"></i></div>
            </pre>
            <p>${this.translate('add-team.message-2', 'contest')}</p>
            <pre>
                <code>${location.origin}/teams/${team.hash}</code>
                <div class="copy" title="${this.translate('copy', 'common')}"><i class="fas fa-copy"></i></div>
            </pre>
        `, { id: 'add-team' })
        .addButton({ id: 'close', text: this.translate('close', 'common'), close: true, isDefault: true });

        // add copy events
        modal.getAll('pre').forEach(copy => {
            copy.addEventListener('click', () => {
                const code = copy.querySelector('code');
                navigator.clipboard.writeText(code.textContent);
                new Toast(this.translate('copy-text', 'contest'), { type: 'success' });
            });
        });
    },

    renameTeam: async function(selected) {
        if (selected.length === 0) return;
        const team = selected[0];
        new Modal(`<h1>${this.translate('teams.rename-title', 'contest')}</h1>`)
        .addInput({ id: 'team-name', label: this.translate('teams.rename-name', 'contest'), value: team.name })
        .addButton({ 
            id: 'rename-team',
            text: this.translate('rename', 'common'),
            callback: async (e, modal) => {
                const name = modal.get('#team-name').value;
                if (!name) {
                    new Toast(this.translate('add-team.error-name', 'contest'), { type: 'error' });
                    return;
                }
                modal.close();
                await new Team({ id: team.id }).update({ name }).catch(() => location.reload());
                new Toast(this.translate('teams.rename-success', 'contest'), { type: 'success' });
                this.build();
            }
        });
    },
}