import Button from "./components/button.js";
import Form from "./components/form.js";
import Modal from "./components/modal.js";
import Table from "./components/table.js";
import Toast from "./components/toast.js";
import Contest from "./model/contest.js";
import Problem from "./model/problem.js";
import Team from "./model/team.js";
import iro from '@jaames/iro';

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
        console.log(this.contest);
        
        const frame = document.querySelector('#frame');
        frame.innerHTML = `<div id="contest">
            <div id="logo-container">
                <span>${this.translate('change-logo', 'contest')}</span>
            </div>
            <h1 id="name">${this.contest.name}</h1>
            <p id="description">${this.contest.description}</p>
            <div id="problems"></div>
            <div id="teams"></div>
            <div id="start-contest"></div>
        </div>`;

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
        if (!this.contest.startTime && this.contest.problems.length > 0 && this.contest.teams.length > 0) {
            const startButton = new Button({ id: 'start-contest', text: this.translate('start-contest.title', 'contest'), customClass: 'default' }).click(() => this.startContest());
            frame.querySelector('#start-contest').appendChild(startButton.get());
        }
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
        }
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
            columns: [ { id: 'name', name: this.translate('name', 'common') }, ],
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
        `);

        const problemList = modal.get().querySelector('#problem-list');
        const table = new Table({
            element: problemList,
            columns: [ { id: 'title', name: this.translate('title', 'common') }, ],
            translate: this.translate,
            selection: { enabled: true, multi: true },
            pagination: true,
            maxItems: 10,
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
                    await this.addProblem(selected);;
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

    addTeam: async function(name) {
        try {
            const team = await new Team({
                contest: this.contest.id,
                name,
            }).add();
            // console.log(team);
            this.modalResetPassword(team);
            new Toast(this.translate('add-team.success', 'contest'), { type: 'success' });
            this.renderTeams();
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