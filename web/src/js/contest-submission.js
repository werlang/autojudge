import Form from "./components/form.js";
import Modal from "./components/modal.js";
import Table from "./components/table.js";
import Toast from "./components/toast.js";
import Translator from "./helpers/translate.js";
import Contest from "./model/contest.js";
import Submission from "./model/submission.js";

import '../less/contest-submission.less';

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('submissions_other', 'common')}</h1>
            <div id="submissions-container" class="admin"></div>
            <form id="new-submission-form">
                <h2>${this.translate('judge.title', 'contest')}</h2>
                <select id="answer" name="answer" required disabled></select>
                <div id="code"></div>
                <div id="button-container"><button type="submit" id="submit" class="default" disabled>${this.translate('submit', 'common')}</button></div>
            </form>
        `;

        this.showSubmissions();
        this.createSubmissionForm();
    },

    showSubmissions: async function() {
        const frame = document.querySelector('#frame');
        const submissionsDOM = frame.querySelector('#submissions-container');
        const table = new Table({
            element: submissionsDOM,
            id: 'submissions', 
            columns: [
                {id: 'status', name: this.translate('submissions.status', 'team'), sort: false, size: 'small'},
                {id: 'time', name: this.translate('submissions.submitted', 'team'), sort: false, size: 'small'},
                {id: 'problem', name: this.translate('problem_one', 'common'), sort: false},
                {id: 'team', name: this.translate('teams_one', 'common'), sort: false, escapeHTML: true},
            ],
            controls: [
                { id: 'log', icon: 'far fa-file-code', title: this.translate('judge.log', 'contest'), action: item => this.showLog(item[0]) },
            ],
            translate: this.translate,
            search: false,
            maxItems: 10,
            pagination: true,
            selection: { enabled: true, multi: false },
        });
        this.table = table;

        table.addItemEvent('click', async item => {
            this.selectedSubmission = table.getSelected()[0];
            this.loadSubmission();

            const selected = table.getSelected();
            const toEnable = [];
            if (selected.length) {
                toEnable.push('log');
            }
            table.disableControl('log');
            table.enableControl(...toEnable);
        });
        table.disableControl('log');

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
            'PARSING_ERROR': { icon: 'fas fa-hourglass-half', class: 'parsing-error' },
        };

        const resp = await new Contest({ id: this.contest.id }).getSubmissions().catch(() => location.reload());
        const submissions = resp.submissions;

        const selected = table.getSelected();

        table.clear();
        // console.log(submissions);
        submissions.map(submission => ({
            id: submission.id,
            code: submission.code,
            filename: submission.filename,
            problem: this.contest.problems.find(p => p.id === submission.problem).title,
            team: this.contest.teams.find(t => t.id === submission.team).name,
            statusData: submission.status,
            status: `<i class="${statusIcons[submission.status].icon} ${statusIcons[submission.status].class}" title="${submission.status}"></i>`,
            time: `<span title="${new Date(submission.submittedAt).toLocaleString(Translator.currentLanguage())}">${this.getElapsedTime(submission.submittedAt)}</span>`,
            timeRaw: new Date(submission.submittedAt).getTime(),
            log: submission.log,
        })).forEach(submission => table.addItem(submission));
        table.srt('timeRaw', 'desc');

        if (selected.length) {
            table.select(selected.map(s => s.id));
        }

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

    createSubmissionForm: async function() {
        const form = new Form(document.querySelector('#new-submission-form'));
        this.formSubmission = form;

        form.getSelect('answer').addOptions([
            { value: 'null', text: this.translate('judge.select', 'contest'), options: { disabled: true, selected: true } },
            { value: 'PENDING', text: 'PENDING' },
            { value: 'ACCEPTED', text: 'ACCEPTED' },
            { value: 'WRONG_ANSWER', text: 'WRONG ANSWER' },
            { value: 'TIME_LIMIT_EXCEEDED', text: 'TIME LIMIT EXCEEDED' },
            { value: 'ERROR', text: 'ERROR' },
        ]);

        form.get('#code').addEventListener('click', () => {
            const isDisabled = form.getButton('submit').isDisabled;
            if (isDisabled || !this.selectedSubmission) return;

            // console.log(this.selectedSubmission);
            // download file
            const a = document.createElement('a');
            a.href = this.selectedSubmission.code;
            a.download = this.selectedSubmission.filename;
            a.click();
        });


        form.submit(async data => {
            // console.log(data)

            try {
                const response = await new Submission({ id: this.selectedSubmission.id }).updateStatus(data.answer);
                await this.updateSubmissions();
                new Toast(this.translate('judge.success', 'contest'), { type: 'success' });
                // console.log(response);
                // wait so the form's enable button is overriden
                setTimeout(() => this.resetSubmission(), 10);
            }
            catch (error) {
                new Toast(this.translate(error.message, 'api'), { type: 'error' });
                console.log(error);
            }
        });

        this.resetSubmission();
    },

    resetSubmission: function() {
        this.selectedSubmission = null;
        const form = this.formSubmission;
        form.getButton('submit').disable(false);
        form.getSelect('answer').get().setAttribute('disabled', true);
        form.getSelect('answer').set('null');
        form.get('#code').innerHTML = `<div class="message"><div class="button">
            <div><i class="fa-solid fa-file-code"></i></div>
            <dvi>${this.translate('judge.file', 'contest')}
        </div></div>`;
        form.get('#code').classList.remove('success');
    },

    loadSubmission: async function() {
        const submission = this.selectedSubmission;
        // console.log(submission);
        const form = this.formSubmission;

        if (!submission) {
            this.resetSubmission();
            return;
        }

        form.getButton('submit').enable();
        form.getSelect('answer').get().removeAttribute('disabled');
        form.getSelect('answer').set(submission.statusData);
        form.get('#code').innerHTML = `<div class="message"><div class="button">
            <div><i class="fa-solid fa-download"></i></div>
            <div>${submission.filename}</div>
        </div></div>`;
        form.get('#code').classList.add('success');
    },

    showLog: function(submission) {
        // console.log(submission);
        if (!submission.log) {
            new Toast(this.translate('judge.no-log', 'contest'), { type: 'error' });
            return;
        }
        const escapeHtml = str => str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot' }[tag]));
        const log = escapeHtml(JSON.stringify(JSON.parse(submission.log), null, 2));
        new Modal(`
            <h1>${this.translate('judge.log', 'contest')}</h1>
            <pre><code>${log}</code></pre>
            <button id="close" class="default">${this.translate('close', 'common')}</button>
        `, { id: 'log-modal', buttonClose: 'close' });
    },
}