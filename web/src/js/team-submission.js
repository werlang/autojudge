import Form from "./components/form.js";
import Table from "./components/table.js";
import Toast from "./components/toast.js";
import Uploader from "./components/uploader.js";
import Translator from "./helpers/translate.js";
import Judge from "./model/judge.js";
import Submission from "./model/submission.js";
import Team from "./model/team.js";


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
            <form id="new-submission-form">
                <h2>${this.translate('new-submission', 'team')}</h2>
                <select name="problem" id="problem" required></select>
                <div id="upload"></div>
                <div id="button-container"><button type="submit" class="default">Upload</button></div>
            </form>
        `;

        this.showSubmissions();
        this.fillProblems();
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
        this.table = table;

        this.updateSubmissions();
    },

    async updateSubmissions() {
        const table = this.table;

        const statusIcons = {
            'ACCEPTED': { icon: 'fas fa-check-circle', class: 'accepted' },
            'WRONG_ANSWER': { icon: 'fas fa-square-xmark', class: 'wrong-answer' },
            'TIME_LIMIT_EXCEEDED': { icon: 'fas fa-clock', class: 'time-limit' },
            'ERROR': { icon: 'fas fa-exclamation-triangle', class: 'error' },
            'PENDING': { icon: 'fas fa-ellipsis fa-fade', class: 'pending' },
        };

        const resp = await new Submission({ token: Team.getToken() }).getAll().catch(() => location.reload());
        const submissions = resp.submissions;

        table.clear();
        // console.log(submissions);
        submissions.map(submission => ({
            problem: submission.problem.title,
            status: `<i class="${statusIcons[submission.status].icon} ${statusIcons[submission.status].class}" title="${submission.status}"></i>`,
            score: `<span>${parseFloat(submission.score).toFixed(1)}</span>`,
            time: `<span title="${new Date(submission.submittedAt).toLocaleString(Translator.currentLanguage())}">${this.getElapsedTime(submission.submittedAt)}</span>`,
        })).forEach(submission => table.addItem(submission));
        table.srt('time', 'desc');

        if (this.refresh) {
            if (this.updateTimeout) clearTimeout(this.updateTimeout);
            this.updateTimeout = setTimeout(() => this.updateSubmissions(table), 5000);
        }
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

    fillProblems: async function() {
        const form = new Form(document.querySelector('#new-submission-form'));
        form.setData({ file: null });

        const resp = await new Team({ id: this.team.id }).getContest().catch(() => location.reload());
        const problems = resp.contest.problems;

        form.getSelect('problem').addOptions([
            { value: '0', text: this.translate('select-problem', 'team'), options: { disabled: true, selected: true } },
            ...problems.map(problem => ({ value: problem.id, text: problem.title }))
        ]);

        const uploader = new Uploader(form.get('#upload'), {
            placeholder: this.translate('hint-source-code', 'team'),
            translate: this.translate,
            accept: '.js, .c, .cpp, .py, .java, .php',
            onUpload: (file, data) => {
                // console.log(file, data);
                if (data.accepted === false) {
                    form.setData({ file: null });
                    return;
                }
    
                form.setData({ file });
                form.setData({ filename: data.name });
            },
            onError: () => {
                new Toast(this.translate('hint-file-type', 'team'), { type: 'error', timeOut: 10000 });
            },
        });

        form.submit(async data => {
            // console.log(data)
            const validation = form.validate([
                { id: 'problem', rule: e => e && e != '0', message: this.translate('error-select-problem', 'team') },
                { id: 'file', rule: e => e, message: this.translate('error-upload-file', 'team') },
            ]);

            if (validation.fail.total > 0) return;

            // TODO: treat messages from the server using translate and show them in the toast.

            try {
                const response = await new Judge(data).run();
                this.updateSubmissions();
                new Toast(response.message, { type: 'success' });
                console.log(response);
            }
            catch (error) {
                new Toast(error.message, { type: 'error' });
                console.log(error);
            }
        });
    },
}