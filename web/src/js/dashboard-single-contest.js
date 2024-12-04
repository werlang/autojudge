import Button from "./components/button.js";
import Form from "./components/form.js";
import Modal from "./components/modal.js";
import Table from "./components/table.js";
import Toast from "./components/toast.js";
import Contest from "./model/contest.js";
import Problem from "./model/problem.js";
import Team from "./model/team.js";
import iro from '@jaames/iro';
import Uploader from "./components/uploader.js";
import TemplateVar from "./helpers/template-var.js";
import Select from "./components/select.js";

import '../less/dashboard-single-contest.less';

// TODO: fix text copying in localhost

export default {

    load: async function({id}) {
        this.contestInstance = new Contest({ id });

        await this.render();

        if (!this.contest) {
            location.href = '/contests';
            return;
        }
        if (this.contest.startTime) {
            location.href = `/contests/${this.contest.id}/dashboard`;
        }
    },

    render: async function() {
        const resp = await this.contestInstance.get(false, true).catch(() => location.href = '/');
        this.contest = resp.contest;
        // console.log(this.contest);
        
        const durationH = Math.floor(this.contest.duration / 60);
        const durationM = parseInt(this.contest.duration) % 60;
        const frame = document.querySelector('#frame');
        frame.innerHTML = `<div id="contest">
            <div id="logo-container">
                <span>${this.translate('change-logo', 'contest')}</span>
            </div>
            <h1 id="name">${this.contest.name}</h1>
            <p id="description">${this.contest.description}</p>
            <div id="settings">
                <label for="duration">${this.translate('duration', 'common')}</label>
                <div id="duration-container">
                    <select id="duration-h" name="duration-h">
                        ${Array.from({ length: 12 }).map((_, i) => `<option value="${i}" ${i == durationH ? 'selected' : ''}>${i} ${this.translate('hours', 'common')}</option>`).join('')}
                    </select>
                    <select id="duration-m" name="duration-m">
                        ${Array.from({ length: 4 }).map((_, i) => `<option value="${i*15}" ${i*15 == durationM ? 'selected' : ''}>${i*15} ${this.translate('minutes', 'common')}</option>`).join('')}
                    </select>
                </div>
                <label id="penalty-label">${this.translate('penalty-time', 'contest')}<i class="fa-solid fa-info-circle hint" title="${this.translate('penalty-time-hint', 'contest')}"></i></label>
                    <select id="penalty" name="penaltyTime" required placeholder="${this.translate('duration', 'common')} (h)">
                        ${Array.from({ length: 13 }).map((_, i) => `<option value="${i*5}" ${i*5 == this.contest.penaltyTime ? 'selected' : ''}>${i*5} ${this.translate('minutes', 'common')}</option>`).join('')}
                    </select>
                    <label id="freeze-label">${this.translate('freeze-time', 'contest')}<i class="fa-solid fa-info-circle hint" title="${this.translate('freeze-time-hint', 'contest')}"></i></label>
                    <select id="freeze" name="freezeTime" required placeholder="${this.translate('duration', 'common')} (m)">
                        ${Array.from({ length: 13 }).map((_, i) => `<option value="${i*5}" ${i*5 == this.contest.freezeTime ? 'selected' : ''}>${i*5} ${this.translate('minutes', 'common')}</option>`).join('')}
                    </select>
            </div>
            <div id="problems"></div>
            <div id="teams"></div>
            <div id="start-contest"></div>
        </div>`;

        const durationHDOM = new Select(frame.querySelector('#duration-h'));
        const durationMDOM = new Select(frame.querySelector('#duration-m'));
        
        [durationHDOM, durationMDOM].forEach(e => e.change(() => {
            const duration = parseInt(durationHDOM.value) * 60 + parseInt(durationMDOM.value);
            this.saveChanges('duration', duration);
        }))
        new Select(frame.querySelector('#penalty')).change((e, value) => this.saveChanges('penaltyTime', value));
        new Select(frame.querySelector('#freeze')).change((e, value) => this.saveChanges('freezeTime', value));

        this.startButton = new Button({ id: 'start-contest', text: this.translate('start-contest.title', 'contest'), customClass: 'default' }).click(() => this.startContest());

        this.renderProblems(false);
        this.renderTeams(false);
        if (!this.contest.startTime) {
            this.createEditableFields();
        }

        // check the logo
        const logoContainer = document.querySelector('#logo-container');
        if (this.contest.logo) {
            const logo = new Image();
            logo.src = this.contest.logo;
            logo.alt = this.contest.name;
            logo.onload = () => {
                logoContainer.innerHTML = '';
                logoContainer.appendChild(logo);
                logoContainer.classList.add('loaded');
            }
        }
        else {
            const content = logoContainer.innerHTML;
            logoContainer.innerHTML = `<div class="editable" title="${this.translate('edit', 'common')}">
                <span class="field">${content}</span>
                <span class="edit-icon"><i class="fas fa-edit"></i></span>
            </div>`;
        }

        // start contest button
        this.startButton.disable(false);
        if (!this.contest.startTime && this.contest.problems.length > 0 && this.contest.teams.length > 0) {
            this.startButton.enable();
        }
        frame.querySelector('#start-contest').appendChild(this.startButton.get());
    },

    renderProblems: async function(update = true) {
        if (update) {
            const resp = await this.contestInstance.get().catch(() => location.reload());
            this.contest = resp.contest;
        }
        const frame = document.querySelector('#frame');
        const problems = frame.querySelector('#problems');
        problems.innerHTML = `<h3>${this.translate('problems', 'contest', {count: this.contest.problems.length})}</h3>`;
        if (this.contest.problems.length ) {
            this.listProblems(problems);
        }

        if (!this.contest.startTime) {
            const addProblem = new Button({ id: 'add-problem', text: `${this.translate('add', 'common')} ${this.translate('problems_one', 'contest')}` }).click(() => this.addProblemModal());
            problems.appendChild(addProblem.get());
        }

        const pdfProblems = new Button({ id: 'get-pdf', text: this.translate('pdf-problems', 'problem') }).click(async () => {
            try {
                const blob = await this.contestInstance.getPDF({
                    input: this.translate('input_samples', 'problem'),
                    output: this.translate('output_samples', 'problem'),
                });
                const pdf = URL.createObjectURL(blob);
                window.open(pdf);
                return;
            }
            catch (error) {
                console.error(error);
                new Toast(error.message, { type: 'error' });
                return;
            }
        });
        problems.appendChild(pdfProblems.get());

        if (!this.contest.problems.length) {
            pdfProblems.disable(false);
        }

        this.startButton.disable(false);
        if (!this.contest.startTime && this.contest.problems.length > 0 && this.contest.teams.length > 0) {
            this.startButton.enable();
        }
    },

    renderTeams: async function(update = true) {
        if (update) {
            const resp = await this.contestInstance.get().catch(() => location.reload());
            this.contest = resp.contest;
        }
        const frame = document.querySelector('#frame');
        const teams = frame.querySelector('#teams');
        teams.innerHTML = `<h3>${this.translate('teams', 'contest', {count: this.contest.teams.length})}</h3>`;
        if (this.contest.teams.length ) {
            this.listTeams(teams);
        }
        if (!this.contest.startTime) {
            const addTeam = new Button({ id: 'add-team', text: `${this.translate('create', 'common')} ${this.translate('teams_one', 'common')}` }).click(() => this.addTeamModal());
            teams.appendChild(addTeam.get());

            const importTeams = new Button({ id: 'import-teams', text: this.translate('import-teams.title', 'contest') }).click(() => this.createImportTeams());
            teams.appendChild(importTeams.get());
        }

        this.startButton.disable(false);
        if (!this.contest.startTime && this.contest.problems.length > 0 && this.contest.teams.length > 0) {
            this.startButton.enable();
        }
    },

    createImportTeams: function() {
        const sampleJson = [
            `Team`,
            `Team Name 1`,
            `Team Name 2`,
            `Team Name 3`,
            `Team Name 4`,
            `Team Name 5`,
        ];
        const modal = new Modal(`
            <h1>${this.translate('import-teams.title', 'contest')}</h1>
            <p>${this.translate('import-teams.description', 'contest')}</p>
            <div class="tabs">
                <nav class="tab-list">
                    <button id="image" class="tab active">${this.translate('import-teams.image', 'contest')}</button>
                    <button id="sample" class="tab">${this.translate('import-teams.sample', 'contest')}</button>
                </nav>
                <div class="tab-content">
                    <div class="tab-pane active" id="image">
                        <img src="/assets/img/import-csv-team.webp" alt="Import teams">
                    </div>
                    <div class="tab-pane" id="sample">
                        <pre><code>${sampleJson.join('\n')}</code></pre>
                    </div>
                </div>
            </div>
            <div class="uploader"></div>
        `, { id: 'import-teams' });

        // Add event listeners for tabs
        modal.get('.tab-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('tab')) {
                const tabs = modal.getAll('.tab');
                const panes = modal.getAll('.tab-pane');
                tabs.forEach(tab => tab.classList.remove('active'));
                panes.forEach(pane => pane.classList.remove('active'));
                e.target.classList.add('active');
                modal.get(`.tab-content #${e.target.id}`).classList.add('active');
            }
        });
        modal.addButton({ text: this.translate('cancel', 'common'), close: true, isDefault: true });

        // add import cases: import test cases from a file
        const uploader = new Uploader(modal.get('.uploader'), {
            placeholder: this.translate('import-teams.placeholder', 'contest'),
            translate: this.translate,
            accept: '.csv',
            format: 'text',
            onUpload: async (file, data) => {
                // console.log(file, data);
                if (data.accepted === false) return;
    
                const cases = this.parseCases(file);
                // console.log(cases);
                if (!cases.length) {
                    uploader.setError();
                    return;
                }

                const teamData = [];
                for (let i in cases) {
                    const caseData = cases[i];
                    teamData.push(await this.addTeam(caseData.name, false));
                }
                modal.close();
                this.render();
                this.showImportedTeams(teamData);
            },
            onError: () => {
                new Toast(this.translate('import-teams.error', 'contest'), { type: 'error', timeOut: 10000 });
            },
        });
    },

    parseCases: function(file) {
        // parse the csv file
        const cases = file.split('\n').map(line => {
            // remove \r
            line = line.replace('\r', '');
            const values = [];
            let inQuotes = false;
            let value = '';
            for (let char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                }
                else if (char === ',' && !inQuotes) {
                    values.push(value);
                    value = '';
                }
                else {
                    value += char;
                }
            }
            values.push(value);
            return values;
        });
        // console.log(cases);

        // validate the csv
        const casesValidate = [...cases];
        let header = casesValidate.shift();
        // check first line for the headers
        if (header.join(',').toLowerCase() !== 'team') {
            new Toast(this.translate('import-teams.error-header', 'contest'), { type: 'error' });
            return [];
        }
        // check each line for the correct number of columns
        for (let i in casesValidate) {
            const caseData = casesValidate[i];
            if (caseData.length !== 1) {
                new Toast(this.translate('import-teams.error-columns', 'contest', {line: parseInt(i) + 2}), { type: 'error' });
                return [];
            }
        }

        return casesValidate.map(c => ({ name: c[0] }));
    },

    createEditableFields: function() {
        // send a new logo as base64
        const logoContainer = document.querySelector('#logo-container');
        logoContainer.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.click();
            input.addEventListener('change', async () => {
                const file = input.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async e => {
                    const base64 = e.target.result;
                    try {
                        await new Contest({ id: this.contest.id }).update({logo: base64});
                        new Toast(this.translate('logo-success', 'contest'), { type: 'success' });
                        this.render();
                    }
                    catch (error) {
                        // console.error(error);
                        new Toast(error.message, { type: 'error' });
                    }
                };
                reader.readAsDataURL(file);
            });
        });


        // edit text fields
        document.querySelectorAll('#name, #description').forEach(e => {
            const content = e.innerHTML;
            e.innerHTML = `<div class="editable" title="${this.translate('edit', 'common')}">
                <span class="field">${content}</span>
                <span class="edit-icon"><i class="fas fa-edit"></i></span>
            </div>`;

            // bind events
            const editable = e.querySelector('.editable');
            const field = e.querySelector('.field');
            
            let oldContent = field.textContent;

            // click the icon
            const editIcon = editable.querySelector('.edit-icon');
            editIcon.addEventListener('click', () => {
                field.contentEditable = 'plaintext-only';
                field.focus();
                // select all the text
                window.getSelection().selectAllChildren(field);
                oldContent = field.textContent;

                editIcon.classList.add('editing');
            });

            // leave the field
            field.addEventListener('blur', () => {
                field.contentEditable = false;
                // change the icon
                editIcon.classList.remove('editing');
                editIcon.innerHTML = '<i class="fas fa-edit"></i>';

                // do not save if the content is the same
                if (oldContent === field.textContent) return;

                // do not save if the content is empty
                if (!field.textContent) {
                    field.textContent = oldContent;
                    return;
                }

                // show save changes modal
                // console.log(editable.parentNode.id, field.textContent);
                new Modal(`
                    <h1>${this.translate('save-changes.h1', 'contest')}</h1>
                    <p>${this.translate('save-changes.message', 'contest', { field: this.translate(`field.${editable.parentNode.id}`, 'contest')})}</p>
                `)
                // save changes
                .addButton({
                    text: this.translate('save', 'common'),
                    close: true,
                    isDefault: false,
                    callback: () => this.saveChanges(editable.parentNode.id, field.textContent)
                })
                // discard changes
                .addButton({ 
                    text: this.translate('discard', 'common'), 
                    close: true,
                    isDefault: true,
                    callback: () => field.textContent = oldContent
                })

            });
        });
    },

    saveChanges: async function(field, content) {
        try {
            const resp = await new Contest({ id: this.contest.id }).update({ [field]: content });
            // console.log(resp);
            new Toast(this.translate('save-changes.success', 'contest'), { type: 'success' });
            this.problem = resp.problem;
        }
        catch (error) {
            // console.error(error);
            new Toast(error.message, { type: 'error' });
        }
    },

    listProblems: async function(container) {

        const controls = [{ id: 'color', icon: 'fas fa-palette', title: this.translate('color-modal.hint', 'contest'), action: (s,e) => this.setColor(s) }];
        if (!this.contest.startTime) {
            controls.push({ id: 'remove', icon: 'fas fa-trash-alt', title: this.translate('remove-problem.title', 'contest'), action: s => this.removeProblem(s) });
        }

        const table = new Table({
            element: container,
            columns: [
                { id: 'color', name: this.translate('color', 'common'), size: 'small', sort: false },
                { id: 'title', name: this.translate('title', 'common') },
            ],
            controls,
            selection: { enabled: true, multi: true },
            translate: this.translate,
            search: false,
        });

        // const problems = await this.contestInstance.getProblems();
        const problems = this.contest.problems;
        table.clear();
        problems.forEach(problem => {
            problem.colorData = problem.color;
            if (problem.color) {
                problem.color = `<div class="color" style="--color-problem: ${problem.color}"></div>`;
            }
            else {
                problem.color = `<div class="color empty"></div>`;
            }
            table.addItem(problem);
        });
        table.addItemEvent('click', item => {
            const selected = table.getSelected();
            const toEnable = [];
            if (selected.length) {
                toEnable.push('remove');
            }
            if (selected.length === 1) {
                toEnable.push('color');
            }
            table.disableControl('remove', 'color');
            table.enableControl(...toEnable);
        });
        table.disableControl('remove', 'color');
    },

    removeProblem: async function(selected) {
        if (selected.length === 0) return;
        try {
            await Promise.all(selected.map(async problem => {
                await this.contestInstance.removeProblem(problem.id);
            }));
        }
        catch (error) {
            // console.error(error);
            new Toast(this.translate(error.message, 'api'), { type: 'error' });
            this.renderProblems();
            return;
        }
        new Toast(this.translate('remove-problem.success', 'contest', {count: selected.length}), { type: 'success' });
        this.renderProblems();
    },

    listTeams: function(container) {
        const table = new Table({
            element: container,
            columns: [ { id: 'name', name: this.translate('name', 'common'), escapeHTML: true }, ],
            controls: [
                ...(this.contest.startTime ? [] : [
                    // remove team
                    { id: 'remove', icon: 'fas fa-trash-alt', title: this.translate('teams.remove-title', 'contest'), action: s => this.removeTeam(s) },
                ]),
                ...[
                    // reset team password
                    { id: 'reset', icon: 'fas fa-redo-alt', title: this.translate('teams.reset-title', 'contest'), action: s => this.resetTeamPassword(s) },
                    // rename team
                    { id: 'rename', icon: 'fas fa-edit', title: this.translate('teams.rename-title', 'contest'), action: s => this.renameTeam(s) },
                ]
            ],
            selection: true,
            translate: this.translate,
            search: false,
        });

        table.clear();
        this.contest.teams.forEach(team => {
            table.addItem(team);
        });
        table.addItemEvent('click', item => {
            const selected = table.getSelected();
            const toEnable = [];

            if (selected.length) {
                toEnable.push('remove');
            }
            if (selected.length === 1) {
                toEnable.push('reset', 'rename');
            }
            table.disableControl('remove', 'reset', 'rename');
            table.enableControl(...toEnable);
        });
        table.disableControl('remove', 'reset', 'rename');
    },

    removeTeam: async function(selected) {
        if (selected.length === 0) return;
        // console.log(selected);
        try {
            new Modal(`
                <h1>${this.translate('teams.remove-title', 'contest')}</h1>
                <p>${this.translate('teams.remove-message', 'contest', {count: selected.length})}</p>
            `)
            .addButton({
                text: this.translate('remove', 'common'),
                isDefault: false,
                close: true,
                callback: async () => {
                    await new Team({ id: selected[0].id }).remove();
                    new Toast(this.translate('teams.remove-success', 'contest', {count: selected.length}), { type: 'success' });
                    this.renderTeams();
                }
            })
            .addButton({ text: this.translate('cancel', 'common'), close: true, isDefault: true });
        }
        catch (error) {
            // console.error(error);
            new Toast(this.translate(error.message, 'api'), { type: 'error' });
            this.renderTeams();
            return;
        }
    },

    resetTeamPassword: async function(selected) {
        if (selected.length === 0) return;
        const team = await new Team({ id: selected[0].id }).resetPassword().catch(() => location.reload());
        new Toast(this.translate('teams.reset-success', 'contest', {count: selected.length}), { type: 'success' });

        this.modalResetPassword(team);
        this.renderTeams();
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
                this.renderTeams();
            }
        });
    },

    addProblemModal: async function() {
        const modal = new Modal(`
            <h1>${this.translate('add-problem.h1', 'contest')}</h1>
            <p>${this.translate('add-problem.message', 'contest')}</p>
            <div id="problem-list"></div>
            <p>${this.translate('add-problem.hash', 'contest')}</p>
        `, { id: 'add-problem' });

        const problemList = modal.get().querySelector('#problem-list');
        const table = new Table({
            element: problemList,
            columns: [ { id: 'title', name: this.translate('title', 'common') }, ],
            translate: this.translate,
            selection: { enabled: true, multi: true },
            pagination: true,
            maxItems: 10,
        });

        modal.addInput({
            id: 'hash',
            label: this.translate('hash-link', 'common'),
            onInput: async (e, value) => {
                if (value.includes('http')) {
                    value = value.split('/').pop();
                }

                const button = modal.getButton('add-problem');
                if (value.length !== TemplateVar.get('hashLength')) return;

                // look for problem
                button.enable();
                button.disable();
                const problem = await new Problem({ hash: value }).get().catch(() => null);
                if (!problem) {
                    new Toast(this.translate('add-problem.error-hash', 'contest'), { type: 'error' });
                    button.enable();
                    button.disable(false);
                    return;
                }
                if (this.contest.problems.find(p => p.id === problem.id)) {
                    new Toast(this.translate('add-problem.already-added', 'contest'), { type: 'error' });
                    button.enable();
                    button.disable(false);
                    return;
                }
                
                if (!table.getItems().find(p => p.id === problem.id)) {
                    table.addItem(problem, 0);
                }
                table.select([...table.getSelected(), problem].map(p => p.id));

                button.enable();
                if (!table.getSelected().length) {
                    button.disable(false);
                }
            },
        });

        modal.addButton({
            id: 'add-problem',
            text: this.translate('add', 'common'),
            callback: async () => {
                const selected = table.getSelected();
                // console.log(selected);
                if (selected.length === 0) return;
                modal.close();
                try {
                    await this.addProblem(selected);
                    new Toast(this.translate('add-problem.success', 'contest'), { type: 'success' });
                    this.renderProblems();
                }
                catch (error) {
                    // console.error(error);
                    new Toast(this.translate(error.message, 'api'), { type: 'error' });
                    this.renderProblems();
                }
            }
        });

        const button = modal.getButton('add-problem');
        button.disable(false);

        const {problems} = await Problem.getAll().catch(() => location.reload());

        table.clear();
        problems.forEach(problem => {
            if (this.contest.problems.find(p => p.id === problem.id)) return;
            table.addItem(problem)
        });
        table.addItemEvent('click', item => {
            const selected = table.getSelected();
            if (selected.length) {
                button.enable();
            }
            else {
                button.disable(false);
            }
        });

    },

    addProblem: async function(problems) {
        // console.log('add problem', problems);
        return Promise.all(problems.map(async problem => {
            return this.contestInstance.addProblem(problem.id);
        }));
    },

    addTeamModal: async function() {
        const modal = new Modal(`
            <h1>${this.translate('add-team.h1-name', 'contest')}</h1>
            <form>
                <input id="team-name" name="team-name" type="text" required placeholder="${this.translate('add-team.team-name', 'contest')}">
                <button id="add-team" class="default">${this.translate('create', 'common')}</button>
            </form>
        `);

        const form = new Form(modal.get('form'));
        form.submit(async data => {
            if (!form.validate([{ id: 'team-name', rule: v => v.length > 3, message: this.translate('add-team.error-name', 'contest') }])) return;

            modal.close();
            await this.addTeam(data['team-name']);
        });
    },

    addTeam: async function(name, showModal = true) {
        try {
            const team = await new Team({
                contest: this.contest.id,
                name,
            }).add();
            // console.log(team);
            if (showModal) {
                this.modalResetPassword(team);
            }
            new Toast(this.translate('add-team.success', 'contest'), { type: 'success' });
            this.renderTeams();
            return team;
        }
        catch (error) {
            // console.error(error);
            new Toast(this.translate(error.message, 'api'), { type: 'error' });
            this.renderTeams();
        }
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

    showImportedTeams: function(teams) {
        const url = `<a id="this-link" target="_blank" href="${location.origin}/teams"><i class="fa-solid fa-arrow-up-right-from-square"></i>${this.translate('import-teams.this-link', 'contest')}</a>`;
        const modal = new Modal(`
            <h1>${this.translate('import-teams.title', 'contest')}</h1>
            <p>${this.translate('import-teams.success-message', 'contest')}</p>
            <div id="table-container"></div>
            <p>${this.translate('import-teams.login-message', 'contest', { url, interpolation: {escapeValue: false} })}</p>
            <p>${this.translate('import-teams.advice-message', 'contest')}</p>
            <p>${this.translate('import-teams.export-message', 'contest')}</p>
        `, { id: 'import-teams' })
        .addButton({ id: 'export', text: this.translate('import-teams.export-button', 'contest'), callback: () => {
            const csvContent = [
                ['Name', 'ID', 'Password'],
                ...teams.map(team => [
                    team.name.includes(',') ? `"${team.name}"` : team.name,
                    team.hash,
                    team.password
                ])
            ].map(e => e.join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'teams.csv');
            link.click();
        } })
        .addButton({ id: 'close', text: this.translate('close', 'common'), close: true, isDefault: true });

        const table = new Table({
            element: modal.get('#table-container'),
            columns: [
                { id: 'name', name: this.translate('name', 'common'), escapeHTML: true },
                { id: 'hash', name: this.translate('id', 'common'), size: 'small' },
                { id: 'password', name: this.translate('password', 'common'), size: 'small' },
            ],
            selection: false,
            translate: this.translate,
            search: true,
            maxItems: 5,
            pagination: true,
        });

        table.clear();
        teams.forEach(team => table.addItem(team));
    },

    startContest: async function() {
        const modal = new Modal(`
            <h1>${this.translate('start-contest.title', 'contest')}</h1>
            <p>${this.translate('start-contest.message', 'contest')}</p>
        `)
        .addButton({
            text: this.translate('start-contest.button', 'contest'),
            callback: async () => {
                modal.close();
                await this.contestInstance.start();
                new Toast(this.translate('start-contest.success', 'contest'), { type: 'success' });
                location.reload();
            },
            isDefault: false,
        })
        .addButton({ text: this.translate('start-contest.cancel', 'contest'), close: true, isDefault: true });
    },

    // create a color picker
    setColor: async function(selected) {
        if (selected.length === 0) return;
        const problem = selected[0];
        // console.log(problem);
        
        const modal = new Modal(`
            <h1>${this.translate('color-modal.title', 'contest')}</h1>
            <p>${this.translate('color-modal.message', 'contest')}</p>
            <div id="picker"></div>
        `, { id: 'color-modal' });
            
        const picker = new iro.ColorPicker(modal.get('#picker'), {
            width: 200,
            color: problem.colorData || '#ff0000',
            layoutDirection: 'horizontal',
        });

        modal.addButton({
            id: 'set-color',
            text: this.translate('color-modal.submit', 'contest'),
            isDefault: true,
            callback: async () => {
                await new Contest({ id: this.contest.id }).updateProblem(problem.id, { color: picker.color.hexString });
                new Toast(this.translate('color-modal.success', 'contest'), { type: 'success' });
                modal.close();
                this.renderProblems();
            },
        });

        picker.on(['color:init', 'color:change'], color => {
            const button = modal.get('#set-color');
            button.style.setProperty('--color-problem', color.hexString);
        });
    }
}