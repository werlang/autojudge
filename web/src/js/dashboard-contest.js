import Card from "./components/card.js";
import Contest from "./model/contest.js";
import Modal from "./components/modal.js";
import Form from "./components/form.js";

import '../less/dashboard-contest.less';

// TODO; Create contest password, so users can enter and create their own teams instead of being assigned to a team by the contest admin

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('contest', 'common', {count: 2})}</h1>
            <p>${this.translate('contests.description', 'dashboard')}</p>
            <div id="contest-container"></div>
        `;

        const container = document.querySelector('#contest-container');

        const contestsPromise = Contest.getAll();

        // create placeholder cards for contests
        this.createPlaceholderCards(container);

        let { contests } = await contestsPromise.catch(() => location.reload());
        // console.log(contests);

        container.innerHTML = '';
        await Promise.all(contests.map(async contest => {
            if (contest.logo) {
                const {contest: contestFull} = await new Contest({ id: contest.id }).get(false, true);
                contest.logo = contestFull.logo;
            }
            // console.log(contest);

            new Card(container, {
                img: contest.logo || null,
                title: contest.name,
                customClass: 'contest',
                description: `
                    <div class="description">${contest.description}</div>
                    <div class="details">
                        <div class="teams" title="${this.translate('teams_other', 'common')}"><i class="fa-solid fa-users"></i> ${contest.teams}</div>
                        <div class="problems" title="${this.translate('problem_other', 'common')}"><i class="fa-solid fa-tasks"></i> ${contest.problems}</div>
                        <div class="duration" title="${this.translate('duration', 'common')}"><i class="fa-solid fa-clock"></i> ${contest.duration} min</div>
                    </div>
                `,
            })
            .click(async () => {
                // console.log(contest);
                location.href = `/contests/${contest.id}${ contest.startTime ? '/dashboard' : '' }`;
            });
        }));

        // create card for adding a new contest
        new Card(container, {
            icon: 'fa-solid fa-plus',
            description: this.translate('contests.add', 'dashboard'),
            customClass: ['contest', 'add'],
        })
        .click(async () => this.add());
    },

    createPlaceholderCards: function(container, size = 5) {
        for (let i = 0; i < size; i++) {
            const lines = Math.floor(Math.random() * 4) + 1;
            const content = '<div>' + Array.from({ length: lines }).map(() => Array(25).fill('0').join('').slice(0, Math.floor(Math.random() * 15) + 10)).map(e => `<span>${e}</span>`).join('') + '</div>';

            new Card(container, {
                title: 'Contest ' + i,
                description: content,
                customClass: ['contest', 'placeholder'],
            });
        }
    },

    add: function() {
        const defaultDuration = 3;
        const defaultPenalty = 20;
        const defaultFreeze = 15;

        const content = document.createElement('div');
        content.innerHTML = `
            <h1>${this.translate('contests.add', 'dashboard')}</h1>
            <form>
                <input id="name" name="name" type="text" required placeholder="${this.translate('name', 'common')}">
                <textarea id="description" name="description" required placeholder="${this.translate('description', 'common')}"></textarea>
                <div>
                    <label id="duration-label">${this.translate('duration', 'common')}</label>
                    <div id="duration-container">
                        <select id="duration-h" name="duration-h" required placeholder="${this.translate('duration', 'common')} (h)">
                            ${Array.from({ length: 12 }).map((_, i) => `<option value="${i}" ${i == defaultDuration ? 'selected' : ''}>${i} ${this.translate('hours', 'common')}</option>`).join('')}
                        </select>
                        <select id="duration-m" name="duration-m" required placeholder="${this.translate('duration', 'common')} (m)">
                            ${Array.from({ length: 4 }).map((_, i) => `<option value="${i*15}" ${i == 0 ? 'selected' : ''}>${i*15} ${this.translate('minutes', 'common')}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div>
                    <div id="penalty-freeze-container">
                        <label id="penalty-label">${this.translate('penalty-time', 'contest')}<i class="fa-solid fa-info-circle hint" title="${this.translate('penalty-time-hint', 'contest')}"></i></label>
                        <select id="penalty" name="penaltyTime" required placeholder="${this.translate('duration', 'common')} (h)">
                            ${Array.from({ length: 13 }).map((_, i) => `<option value="${i*5}" ${i*5 == defaultPenalty ? 'selected' : ''}>${i*5} ${this.translate('minutes', 'common')}</option>`).join('')}
                        </select>
                        <label id="freeze-label">${this.translate('freeze-time', 'contest')}<i class="fa-solid fa-info-circle hint" title="${this.translate('freeze-time-hint', 'contest')}"></i></label>
                        <select id="freeze" name="freezeTime" required placeholder="${this.translate('duration', 'common')} (m)">
                            ${Array.from({ length: 13 }).map((_, i) => `<option value="${i*5}" ${i*5 == defaultFreeze ? 'selected' : ''}>${i*5} ${this.translate('minutes', 'common')}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button class="default">${this.translate('send', 'common')}</button>
            </form>
        `;
        const modal = new Modal(content, { id: 'add-contest' });
        const form = new Form(content.querySelector('form'));

        form.submit(async data => {
            // console.log(data);

            data.duration = parseInt(data['duration-h']) * 60 + parseInt(data['duration-m']);
            try {
                // create problem and redirect to it
                const { contest } = await new Contest(data).create()//.catch(() => location.reload());
                location.href = `/contests/${contest.id}`;
            }
            catch (error) {
                console.error(error);
                new Toast(this.translate('contests.error', 'dashboard'), { type: 'error' });
            }
        })
    },
}
