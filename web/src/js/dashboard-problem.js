import Table from "./components/table.js";
import Problem from "./model/problem.js";

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = '<h1>Problems</h1>';

        const problemsPromise = Problem.getAll();

        const table = new Table({ element: frame, id: 'problems', columns: [
            {id: 'title', name: 'Title'},
            {id: 'description', name: 'Description'},
        ]});

        const { problems } = await problemsPromise;
        // console.log(problems);
        table.clear();
        problems.forEach(problem => table.addItem(problem));

    },

    

}