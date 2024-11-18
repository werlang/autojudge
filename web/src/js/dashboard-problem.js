import Table from "./components/table.js";
import Problem from "./model/problem.js";
import Modal from "./components/modal.js";
import Form from "./components/form.js";
import Toast from "./components/toast.js";
import Translator from "./helpers/translate.js";
import Button from "./components/button.js";

import '../less/dashboard-problem.less';

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `<div id="problems-container">
            <h1>${this.translate('problem', 'common', {count: 2})}</h1>
            <p>${this.translate('problems.description', 'dashboard')}</p>
        </div>`;
        const problemsDOM = frame.querySelector('#problems-container');

        const table = new Table({
            element: problemsDOM,
            id: 'problems', 
            columns: [
                {id: 'title', name: this.translate('title', 'common')},
            ],
            translate: this.translate,
            search: true,
            pagination: true,
            maxItems: 10,
        });

        const addButton = new Button({ id: 'add-problem', text: this.translate('problems.table.add', 'dashboard'), }).click(() => this.add());
        problemsDOM.appendChild(addButton.get());

        const { problems } = await Problem.getAll();
        // console.log(problems);
        table.clear();
        problems.filter(problem => problem.author)
        .forEach(problem => {
            // if (problem.author) {
            //     problem.title += `<span class="author-card" title="${this.translate('problems.table.author-title', 'dashboard')}">${this.translate('problems.table.author', 'dashboard')}</span>`;
            // }
            table.addItem(problem);
        });

        table.addItemEvent('click', async item => {
            this.show(item);
        });
    },

    add: function() {
        const content = document.createElement('div');
        content.innerHTML = `
            <h1>${this.translate('problems.add.h1', 'dashboard')}</h1>
            <form>
                <input id="title" type="text" required placeholder="${this.translate('title', 'common')}">
                <button class="default">${this.translate('send', 'common')}</button>
            </form>
        `;
        // <input type="checkbox" id="isPublic" placeholder="${this.translate('public', 'common')}" checked>
        // <p id="public-warn" class="warn active">${this.translate('problems.add.public-warn', 'dashboard')}</p>
        // <p id="private-warn" class="warn">${this.translate('problems.add.private-warn', 'dashboard')}</p>
        
        const modal = new Modal(content, { id: 'add-problem' });
        const form = new Form(content.querySelector('form'));

        // form.getInput('isPublic').change(ev => {
        //     modal.getAll('.warn').forEach(warn => warn.classList.toggle('active'));
        // });

        form.submit(async data => {
            // console.log(data);
            data.language = Translator.currentLanguage();
            data.description = this.translate('problems.add.description', 'dashboard');
            try {
                // create problem and redirect to it
                const problem = await new Problem(data).create().catch(() => location.reload());
                location.href = `/problems/${problem.hash}`;
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
            <h3>${this.translate('inout-public', 'problem', {count: inputLength(item.input)})}</h3>
            ${codes}
        `, { id: 'problem' })
        .addButton({ text: this.translate('close', 'common'), close: true })
        .addButton({ 
            text: `${this.translate('details', 'common')}${item.author ? ` / ${this.translate('edit', 'common')}` : ''}`,
            isDefault: false,
            callback: () => location.href = `/problems/${item.hash}`
        });
    },
}