import Table from "./components/table.js";
import Contest from "./model/contest.js";

// TODO: Create some things to populate the problems table besides the title

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('problem_other', 'common')}</h1>
            <div id="problems-container">
            </div>
        `;

        const problemsDOM = frame.querySelector('#problems-container');

        const table = new Table({
            element: problemsDOM,
            id: 'problems', 
            columns: [
                {id: 'title', name: this.translate('title', 'common')},
            ],
            translate: this.translate,
            search: false,
        });

        const {contest} = await new Contest({ id: this.contest.id }).get();
        // console.log(contest);

        table.clear();
        contest.problems.forEach(problem => table.addItem(problem));

        table.addItemEvent('click', async item => {
            location.href = `/problems/${item.hash}`;
        });
    },
}