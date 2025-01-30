import Form from "./components/form.js";
import Modal from "./components/modal.js";
import Table from "./components/table.js";
import Toast from "./components/toast.js";
import Uploader from "./components/uploader.js";
import Translator from "./helpers/translate.js";
import Judge from "./model/judge.js";
import Submission from "./model/submission.js";
import Team from "./model/team.js";

import '../less/team-submission.less';

export default {
    build: async function() {
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

        this.statusIcons = {
            'ACCEPTED': { icon: 'fas fa-check-circle', class: 'accepted', description: this.translate('status.accepted', 'team') },
            'WRONG_ANSWER': { icon: 'fas fa-square-xmark', class: 'wrong-answer', description: this.translate('status.wrong-answer', 'team') },
            'TIME_LIMIT_EXCEEDED': { icon: 'fas fa-clock', class: 'time-limit', description: this.translate('status.time-limit', 'team') },
            'ERROR': { icon: 'fas fa-exclamation-triangle', class: 'error', description: this.translate('status.error', 'team') },
            'PENDING': { icon: 'fas fa-ellipsis fa-fade', class: 'pending', description: this.translate('status.pending', 'team') },
            'PARSING_ERROR': { icon: 'fas fa-hourglass-half', class: 'parsing-error', description: this.translate('status.parsing-error', 'team') },
        }

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
                {id: 'score', name: this.translate('time', 'common'), sort: false, size: 'small'},
            ],
            translate: this.translate,
            search: false,
            maxItems: 10,
            pagination: true,
        });
        this.table = table;

        table.addItemEvent('click', async item => {
            // console.log(item.hint);
            new Modal(`
                <h1>${item.status}${item.statusRaw}</h1>
                <p>${this.statusIcons[item.statusRaw].description}</p>
                ${
                    item.hint && item.hint.message ? `<pre><code>${item.hint.message || ''}</code></pre>` :
                    item.hint && item.hint.expected ?
                        `<div>${this.translate('expected', 'common')}</div>
                        <pre><code>${item.hint.expected || ''}</code></pre>
                        <div>${this.translate('received', 'common')}</div>
                        <pre><code>${item.hint.received || ''}</code></pre>` :
                    item.hint ? `<pre><code>${item.hint || ''}</code></pre>` :
                    ''
                }
                <button id='close' class="default">OK</button>
            `, { id: 'submission-hint', buttonClose: 'close' });
        });

        this.updateSubmissions();
    },

    async updateSubmissions() {
        const table = this.table;

        const resp = await new Submission({ token: Team.getToken() }).getAll().catch(() => location.reload());
        const submissions = resp.submissions;

        table.clear();
        // console.log(submissions);
        submissions.map(submission => ({
            problem: submission.problem.title,
            status: `<i class="${this.statusIcons[submission.status].icon} ${this.statusIcons[submission.status].class}" title="${submission.status}"></i>`,
            statusRaw: submission.status,
            score: `<span>${(parseFloat(submission.score) / 1000 / 60).toFixed(2)}</span>`,
            time: `<span title="${new Date(submission.submittedAt).toLocaleString(Translator.currentLanguage())}">${this.getElapsedTime(submission.submittedAt)}</span>`,
            timeSort: new Date(submission.submittedAt).getTime(),
            hint: submission.hint,
        })).forEach(submission => table.addItem(submission));
        table.srt('timeSort', 'desc');

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
        form.setData({ code: null });

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
                    form.setData({ code: null });
                    return;
                }
    
                form.setData({ code: file });
                form.setData({ filename: data.name });
            },
            onError: () => {
                new Toast(this.translate('hint-file-type', 'team'), { type: 'error', timeOut: 10000 });
            },
        });

        form.submit(async data => {
            // console.log(data)
            if (!form.validate([
                { id: 'problem', rule: e => e && e != '0', message: this.translate('error-select-problem', 'team') },
                { id: 'code', rule: e => e, message: this.translate('error-upload-file', 'team') },
            ])) return;

            try {
                const response = await new Judge(data).run();
                this.updateSubmissions();
                new Toast(this.translate(response.message, 'api'), { type: 'success' });
                // console.log(response);
                form.clear();
                uploader.reset();
            }
            catch (error) {
                new Toast(this.translate(error.message, 'api'), { type: 'error' });
                console.log(error);
            }
        });
    },
}