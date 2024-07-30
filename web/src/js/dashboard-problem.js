import Table from "./components/table.js";
import Problem from "./model/problem.js";
import Modal from "./components/modal.js";
import Form from "./components/form.js";
import Toast from "./components/toast.js";
import Translator from "./helpers/translate.js";

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('problem', 'common', {count: 2})}</h1>
            <p>${this.translate('problems.description', 'dashboard')}</p>
        `;

        const problemsPromise = Problem.getAll();

        const table = new Table({
            element: frame,
            id: 'problems', 
            columns: [
                {id: 'title', name: this.translate('title', 'common')},
            ],
            controls: [
                {id: 'add', icon: 'fa fa-plus', title: this.translate('problems.table.add', 'dashboard'), action: () => this.add()},
            ],
            translate: this.translate,
        });

        let { problems } = await problemsPromise;
        // console.log(problems);
        table.clear();
        problems.forEach(problem => {
            if (problem.author) {
                problem.title += `<span class="author-card" title="${this.translate('problems.table.author-title', 'dashboard')}">${this.translate('problems.table.author', 'dashboard')}</span>`;
            }
        });
        problems.forEach(problem => table.addItem(problem));

        table.addItemEvent('click', async item => {
            this.show(item);
        });
    },

    add: function() {
        const content = document.createElement('div');
        content.innerHTML = `
            <h1>${this.translate('problems.add.h1', 'dashboard')}</h1>
            <form>
                <input id="title" name="title" type="text" required placeholder="${this.translate('title', 'common')}">
                <button class="default">${this.translate('send', 'common')}</button>
            </form>
        `;
        const modal = new Modal(content, { id: 'add-problem' });
        const form = new Form(content.querySelector('form'));

        form.submit(async data => {
            // console.log(data);
            data.language = Translator.currentLanguage();
            data.description = this.translate('problems.add.description', 'dashboard');
            try {
                // create problem and redirect to it
                const { problem } = await new Problem(data).create();
                location.href = `/problems/${problem.id}`;
            }
            catch (error) {
                console.error(error);
                new Toast(this.translate('problems.add.error', 'dashboard'), { type: 'error' });
            }
        })
    },

    show: function (item) {
        // console.log(item);
        const inputLength = item => item && item.length ? JSON.parse(item).length : 0;
        const getItems = item => item && item.length ? JSON.parse(item) || [] : [];
        const io = {
            input: getItems(item.input),
            output: getItems(item.output)
        };

        const codes = io.input.map((_, i) => `<div class="code">
            ${[Object.keys(io).map(key => `<div class="case">
                <span class="label">${this.translate(key, 'problem')}</span>
                ${io[key][i]}
            </div>`).join('')]}
        </div>`).join('');

        const modal = new Modal(`
            <h1 title="title">${item.title}</h1>
            <p id="description">${item.description}</p>
            <h3>${this.translate('inout', 'problem', {count: inputLength(item.input), hidden: ''})}</h3>
            ${codes}
        `, { id: 'problem' })
        .addButton({ text: this.translate('close', 'common'), close: true })
        .addButton({ 
            text: `${this.translate('open', 'common')}${item.author ? ` / ${this.translate('edit', 'common')}` : ''}`,
            isDefault: false,
            callback: () => location.href = `/problems/${item.id}` 
        });
    },
}