import Table from "./components/table.js";
import Problem from "./model/problem.js";
import Modal from "./components/modal.js";
import Form from "./components/form.js";
import Toast from "./components/toast.js";

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `<h1>${this.translate('problems.h1', 'dashboard')}</h1>`;

        const problemsPromise = Problem.getAll();

        const table = new Table({
            element: frame,
            id: 'problems', 
            columns: [
                {id: 'title', name: this.translate('problems.table.title', 'dashboard')},
            ],
            controls: [
                {id: 'add', icon: 'fas fa-plus', title: this.translate('problems.table.add', 'dashboard'), action: () => this.add()},
            ],
            translate: this.translate,
        });

        const { problems } = await problemsPromise;
        // console.log(problems);
        table.clear();
        problems.forEach(problem => table.addItem(problem));

        table.addItemEvent('click', async item => {
            // console.log(item);
            const mapInput = item => item && item.length ? JSON.parse(item).map((icase, i) => `<div class="case"><span class="label">${this.translate('case', 'problem')} ${i+1}</span>${icase}</div>`).join('') : '';
            const inputLength = item => item && item.length ? JSON.parse(item).length : 0;

            new Modal(`
                <h1>${item.title}</h1>
                <p>${item.description}</p>
                <h3>${this.translate('input', 'problem', {count: inputLength(item.input)})}</h3>
                <div class="code">${mapInput(item.input)}</div>
                <h3>${this.translate('output', 'problem', {count: inputLength(item.output)})}</h3>
                <div class="code">${mapInput(item.output)}</div>
            `, { id: 'problem' })
            .addButton({ text: 'OK', isDefault: true, close: true });
        });
    },

    add: function() {
        const content = document.createElement('div');
        content.innerHTML = `
            <h1>${this.translate('problems.add.h1', 'dashboard')}</h1>
            <form>
                <input id="title" name="title" type="text" required placeholder="${this.translate('problems.add.title', 'dashboard')}">
                <textarea id="description" name="description" required placeholder="${this.translate('problems.add.description', 'dashboard')}"></textarea>
                <button class="default">${this.translate('problems.add.submit', 'dashboard')}</button>
            </form>
        `;
        const modal = new Modal(content, { id: 'add-problem' });
        const form = new Form(content.querySelector('form'));

        form.submit(async data => {
            console.log(data);
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
    }

}