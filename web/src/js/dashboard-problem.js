import Table from "./components/table.js";
import Problem from "./model/problem.js";
import Modal from "./components/modal.js";
import { translations } from "./components/footer.js";

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `<h1>${translations['dashboard-problems-h1']}</h1>`;

        const problemsPromise = Problem.getAll();

        const table = new Table({
            element: frame,
            id: 'problems', 
            columns: [
                {id: 'title', name: translations['dashboard-problems-table-title']},
            ],
            controls: [
                {id: 'add', icon: 'fas fa-plus', title: translations['dashboard-problems-table-add'], action: () => this.add()},
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