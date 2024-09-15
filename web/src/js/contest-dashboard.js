import Button from './components/button.js';
import Card from './components/card.js';
import createClock from './components/contest-clock.js';
import Modal from './components/modal.js';
import Contest from './model/contest.js';

export default {
    build: async function() {
        // console.log(this.contest);
        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('contest_one', 'common')} ${this.contest.name}</h1>
            <p id="contest-description">${this.contest.description}</p>
            <div id="time-left"></div>
            <div id="dashboard-cards"></div>
            <button id="reset-contest" class="default">${this.translate('dashboard.reset-contest', 'contest')}</button>
        `;

        createClock(document.querySelector('#time-left'), {
            contest: this.contest,
            translate: this.translate,
        });

        const {submissions} = await new Contest({ id: this.contest.id }).getSubmissions();
        // console.log(submissions);
        this.contest.submissions = submissions;

        const container = document.querySelector('#dashboard-cards');

        const correctSubmissionCount = this.contest.submissions.filter(submission => submission.status === 'ACCEPTED').length;
        // create card for submissions
        new Card(container, {
            title: this.translate('submissions_other', 'common'),
            icon: 'fas fa-file-code',
            description: `<div id="submissions-count">
                <span class="count">${this.contest.submissions.length}</span>
                <span>${this.translate('dashboard.submissions.total', 'contest', {count: this.contest.submissions.length})}</span>
            </div>
            <div id="correct">
                <span class="count">${correctSubmissionCount}</span>
                <span><i class="fas fa-check-circle accepted"></i>${this.translate('dashboard.submissions.accepted', 'contest', {count: correctSubmissionCount})}</span>
            </div>
            `,
        }).click(() => location.href = `/contests/${this.contest.id}/submissions`);

        // create cards for problems
        new Card(container, {
            title: this.translate('problem_other', 'common'),
            icon: 'fas fa-tasks',
            description: `<div id="problems-count">
                <span class="count">${this.contest.problems.length}</span>
                <span>${this.translate('dashboard.problems.total', 'contest')}</span>
            </div>
            <div id="accepted">
                <span class="count">${this.contest.submissions.filter(s => s.status === 'ACCEPTED').map(s => s.problem).reduce((p,c) => p.includes(c) ? p : [...p,c], []).length}</span>
                <span><i class="fas fa-check-circle accepted"></i>${this.translate('dashboard.problems.accepted', 'contest')}</span>
            </div>`,
        }).click(() => location.href = `/contests/${this.contest.id}/problems`);

        // create card for teams
        new Card(container, {
            title: this.translate('teams_other', 'common'),
            icon: 'fas fa-users',
            description: `<div id="teams-count">
                <span class="count">${this.contest.teams.length}</span>
                <span>${this.translate('dashboard.teams', 'contest')}</span>
            </div>
            <div id="winner">
                <i class="fas fa-star"></i> ${this.contest.teams.toSorted((a,b) => (b.solvedProblems.length * 1e9 - b.score) - (a.solvedProblems.length * 1e9 - a.score))[0].name}
            </div>`,
        }).click(() => location.href = `/contests/${this.contest.id}/teams`);

        const resetButton = new Button({
            element: frame.querySelector('#reset-contest'),
            callback: () => {
                new Modal(`
                    <h1>${this.translate('dashboard.reset-contest', 'contest')}</h1>
                    <p>${this.translate('dashboard.reset-contest-message', 'contest')}</p>
                `)
                .addButton({
                    text: this.translate('yes', 'common'),
                    callback: async (e, modal) => {
                        modal.close();
                        resetButton.disable();
                        await new Contest({ id: this.contest.id }).reset();
                        resetButton.enable();
                        location.href = `/contests/${this.contest.id}`;
                    },
                    isDefault: false,
                })
                .addButton({
                    text: this.translate('no', 'common'),
                    close: true,
                });
            },
        })
    },
}