import Table from "./components/table.js";
import Translator from "./helpers/translate.js";
import Submission from "./model/submission.js";


export default {
    build: async function(objects) {
        for (const key in objects) {
            this[key] = objects[key];
        }

        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('teams_one', 'common')} ${this.team.name}</h1>
            <div id="submissions-container">
                <h2>${this.translate('submissions_other', 'common')}</h2>
            </div>
        `;

        this.showSubmissions();
    },

    showSubmissions: async function() {
        const frame = document.querySelector('#frame');
        const submissionsDOM = frame.querySelector('#submissions-container');
        const table = new Table({
            element: submissionsDOM,
            id: 'submissions', 
            columns: [
                {id: 'problem', name: this.translate('problem_one', 'common'), sort: false},
                {id: 'time', name: this.translate('submissions.submitted', 'team'), sort: false, size: 'small'},
                {id: 'status', name: this.translate('submissions.status', 'team'), sort: false, size: 'small'},
                {id: 'score', name: this.translate('score', 'common'), sort: false, size: 'small'},
            ],
            translate: this.translate,
            search: false,
        });

        this.updateSubmissions(table);
    },

    async updateSubmissions(table) {

        const statusIcons = {
            'ACCEPTED': { icon: 'fas fa-check-circle', class: 'accepted' },
            'WRONG_ANSWER': { icon: 'fas fa-square-xmark', class: 'wrong-answer' },
            'TIME_LIMIT_EXCEEDED': { icon: 'fas fa-clock', class: 'time-limit' },
            'ERROR': { icon: 'fas fa-exclamation-triangle', class: 'error' },
            'PENDING': { icon: 'fas fa-ellipsis fa-fade', class: 'pending' },
        };

        const {submissions} = await new Submission({ token: this.token }).getAll();
        table.clear();
        // console.log(submissions);
        submissions.map(submission => ({
            problem: submission.problem.title,
            status: `<i class="${statusIcons[submission.status].icon} ${statusIcons[submission.status].class}" title="${submission.status}"></i>`,
            score: `<span>${parseFloat(submission.score).toFixed(1)}</span>`,
            time: `<span title="${new Date(submission.submittedAt).toLocaleString(Translator.currentLanguage())}">${this.getElapsedTime(submission.submittedAt)}</span>`,
        })).forEach(submission => table.addItem(submission));
        table.srt('time', 'desc');

        setTimeout(() => this.updateSubmissions(table), 5000);
    },

    getElapsedTime: function(date) {
        const time = new Date(date).getTime();
        const now = Date.now();
        const diff = now - time;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}m`;
        if (seconds > 0) return `${seconds}s`;
        return 'now';
    },

}