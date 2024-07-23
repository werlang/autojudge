import Table from "./components/table.js";
import Problem from "./model/problem.js";
import Modal from "./components/modal.js";
import translate from "./helpers/translate.js";

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `<h1>${translate('dashboard-problems-h1')}</h1>`;

        const problemsPromise = Problem.getAll();

        const table = new Table({
            element: frame,
            id: 'problems', 
            columns: [
                {id: 'title', name: translate('dashboard-problems-table-title')},
            ],
            controls: [
                {id: 'add', icon: 'fas fa-plus', title: translate('dashboard-problems-table-add'), action: () => this.add()},
            ]
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