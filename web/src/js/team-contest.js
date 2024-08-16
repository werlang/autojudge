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
            <p id="contest-description"></p>
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
                {id: 'name', name: this.translate('name', 'common'), sort: false},
                {id: 'score', name: this.translate('score', 'common'), sort: false, size: 'small'},
            ],
            translate: this.translate,
            search: false,
        });

        this.updateTeams(table);
    },
    
    async updateTeams(table) {
        const {contest} = await new Team({ id: this.team.id, token: this.token }).getContest();
        this.contest = contest;
        this.createClock();
        // console.log(this.contest);
    
        table.clear();
        this.contest.teams.map(team => ({
            name: team.name,
            score: `<span>${parseFloat(team.score).toFixed(1)}</span>`,
        })).forEach(team => table.addItem(team));
        table.srt('score', 'desc');

        if (this.refresh) {
            if (this.updateTimeout) clearTimeout(this.updateTimeout);
            this.updateTimeout = setTimeout(() => this.updateTeams(table), 5000);
        }
    },

    formatClock: function(time) {
        const date = new Date(time);
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const seconds = date.getUTCSeconds();
        return `
            <span>${hours.toString().padStart(2, '0')}</span>:
            <span>${minutes.toString().padStart(2, '0')}</span>:
            <span>${seconds.toString().padStart(2, '0')}</span>
        `;
    },

    createClock: function() {
        const timeLeftDOM = document.querySelector('#time-left');
        if (!timeLeftDOM || timeLeftDOM.innerHTML) return;

        const contest = this.contest;
        document.querySelector('#contest-description').innerHTML = contest.description;
    
        if (contest.startTime && contest.duration) {
            const startTime = new Date(contest.startTime).getTime();
            const duration = contest.duration * 60 * 1000;
            const timeLeft = new Date(duration - (Date.now() - startTime)).getTime();
            this.updateClock(timeLeft);
    
            // contest is finished
            if (timeLeft < 0) {
                timeLeftDOM.innerHTML = `
                    <span id="message">${this.translate('contest.finished', 'team')}</span>
                    <div id="clock">${this.formatClock(0)}</div>
                `;
            }
            else {
                let timeLeft = new Date(duration - (Date.now() - startTime)).getTime();
                let message = this.translate('contest.ends', 'team');
                
                // contest is not started yet
                if (startTime > Date.now()) {
                    timeLeft = new Date(startTime - Date.now()).getTime();
                    message = this.translate('contest.starts', 'team');
                }
    
                timeLeftDOM.innerHTML = `
                    <span id="message">${message}</span>
                    <div id="clock">${this.formatClock(timeLeft)}</div>
                `;
    
                this.renderClock();
            }
        }
    },

    renderClock: function() {
        // check if clock is in the DOM
        const clock = document.querySelector('#time-left #clock');
        if (!clock) return;
        
        clock.innerHTML = this.formatClock(this.timeLeft);
        // console.log(this.timeLeft);
        
        if (this.timeLeft <= 0) {
            this.build();
        }
        else {
            setTimeout(() => this.renderClock(), 1000);
        }
    },

    updateClock: function(timeLeft) {
        if (this.clockTicking) return;
        this.clockTicking = true;
        this.timeLeft = timeLeft;
        // console.log(timeLeft);
        
        const start = Date.now();
        if (timeLeft > 0) {
            setTimeout(() => {
                this.clockTicking = false;
                this.updateClock(timeLeft - (Date.now() - start));
            }, 1000);
        }
    },

}