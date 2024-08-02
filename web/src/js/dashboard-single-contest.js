import Button from "./components/button.js";
import Modal from "./components/modal.js";
import Table from "./components/table.js";
import Toast from "./components/toast.js";
import Contest from "./model/contest.js";

export default {

    load: async function(id) {
        const {contest} = await new Contest({ id }).get();
        // console.log(contest);

        if (!contest) {
            location.href = '/contests';
            return;
        }

        this.contest = contest;
        this.render();
    },

    render: function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `<div id="contest">
            <h1 id="name">${this.contest.name}</h1>
            <p id="description">${this.contest.description}</p>
            <div id="problems"></div>
            <div id="teams"></div>
        </div>`;

        const problems = document.querySelector('#problems');
        problems.innerHTML = `<h3>${this.translate('problems', 'contest', {count: this.contest.problems.length})}</h3>`;
        this.listProblems(problems);
        const addProblem = new Button({ id: 'add-problem', text: `${this.translate('add', 'common')} ${this.translate('problems_one', 'contest')}` }).click(() => this.addProblem());
        problems.appendChild(addProblem.get());

        const teams = document.querySelector('#teams');
        teams.innerHTML = `<h3>${this.translate('teams', 'contest', {count: this.contest.teams.length})}</h3>`;
        this.listTeams(teams);
        const addTeam = new Button({ id: 'add-team', text: `${this.translate('add', 'common')} ${this.translate('teams_one', 'contest')}` }).click(() => this.addTeam());
        teams.appendChild(addTeam.get());


        this.createEditableFields();

    },

    createEditableFields: function() {
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
            console.error(error);
            new Toast(error.message, { type: 'error' });
        }
    },

    listProblems: function(container) {
        this.contest.problems.forEach(problem => {
            const p = document.createElement('p');
            p.innerHTML = `${problem.title}`;
            container.appendChild(p);
        });
    },

    listTeams: function(container) {
        this.contest.teams.forEach(team => {
            const p = document.createElement('p');
            p.innerHTML = `${team.name}`;
            container.appendChild(p);
        });
    },

    addProblem: function() {
        const modal = new Modal(`
            <h1>${this.translate('add-problem.h1', 'contest')}</h1>
            <p>${this.translate('add-problem.message', 'contest')}</p>
            <div id="problem-list"></div>
        `);

        const problemList = modal.get().querySelector('#problem-list');
        const table = new Table({
            element: problemList,
            columns: [
                { id: 'title', name: this.translate('title', 'common') },
            ],
            translate: this.translate,
        });

    },

    addTeam: function() {
        console.log('add team');
    },

    // TODO: add start contest flow
}