import Problem from "./model/problem.js";

export default {
    build: async function() {
        const problemsPromise = Problem.getAll();

        this.domElement = document.createElement('div');
        this.domElement.id = 'problems';
        const frame = document.querySelector('#frame');
        frame.innerHTML = '<h1>Problems</h1>';
        frame.appendChild(this.domElement);

        this.domElement.innerHTML = `<div class="head">
            <div class="add button" title="Add Problem"><i class="fas fa-plus"></i></div>
            <div class="search button" title="Search"><i class="fas fa-search"></i></div>
        </div>`;
        for (let i = 0 ; i < 10 ; i++) {
            this.addProblem({ title: 'Placeholder Problem ' + i, customClass: 'placeholder' });
        }

        // const { problems } = await problemsPromise;
        // // console.log(problems);
        // problems.forEach(problem => this.addProblem(problem));
    },

    addProblem: function(problem) {
        const item = document.createElement('div');
        item.classList.add('problem');
        if (problem.customClass) {
            item.classList.add(problem.customClass);
        }
        item.innerHTML = `
            <div class="title">${problem.title}</div>
        `;

        this.domElement.appendChild(item);
    },


}