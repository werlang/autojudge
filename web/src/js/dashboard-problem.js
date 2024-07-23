import Table from "./components/table.js";
import Problem from "./model/problem.js";
import Modal from "./components/modal.js";
import translate from "./helpers/translate.js";

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

    },

    add: function() {
        const modal = new Modal(`Add Problem`);
    }

}