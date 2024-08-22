import Contest from './model/contest.js';
import Problem from './model/problem.js'

export default {

    build: async function(objects) {
        for (const key in objects) {
            this[key] = objects[key];
        }
        console.log(this.team);
        

        const {problem} = await new Problem({ id: this.problemId }).get().catch(() => location.href = '/teams');
        // console.log(problem);
        const {contest} = await new Contest({ id: this.team.contest.id }).get(true).catch(() => location.href = '/teams');
        // console.log(contest);

        const problemList = contest.problems.map(problem => problem.id);

        if (!problemList.includes(problem.id)) {
            location.href = '/teams';
            return;
        }

        this.problem = problem;
        this.render();
    },

    render: function() {
        const inputLength = item => item && item.length ? JSON.parse(item).length : 0;

        const frame = document.querySelector('#frame');
        frame.innerHTML = `<div id="problem">
            <h1 id="title">${this.problem.title}</h1>
            <p id="description">${this.problem.description}</p>
            <div id="public-codes"></div>
        </div>`;

        // add public cases: public test cases are always visible
        const publicCodes = frame.querySelector('#problem #public-codes');
        publicCodes.innerHTML = `<h3>${this.translate('inout', 'problem', {count: inputLength(this.problem.input), hidden: ''})}</h3>`;
        // create a container for the cases
        const codeContainerPublic = document.createElement('div');
        codeContainerPublic.classList.add('code-container');
        // render the cases in the container
        this.renderCases(codeContainerPublic, this.problem.input, this.problem.output);
        publicCodes.appendChild(codeContainerPublic);
    },

    createCaseNode: function(input, output, ) {

        const code = document.createElement('div');
        code.classList.add('code');

        code.innerHTML = `
            <div class="case-container">
                <div class="case">
                    <span class="label">${this.translate('input', 'problem')}</span>
                    ${input || ''}
                </div>
                <div class="case">
                    <span class="label">${this.translate('output', 'problem')}</span>
                    ${output || ''}
                </div>
            </div>
        `;

        return code;
    },

    renderCases: function(container, inputs, outputs) {
        // console.log(inputs, outputs);
        // parse the input and output: they are like ["1 2", "3 4"]
        const getItems = item => item && item.length ? JSON.parse(item) || [] : [];
        const io = {
            input: getItems(inputs),
            output: getItems(outputs),
        };

        container.innerHTML = '';
        // append each case to the container in the format:
        // input1 output1, input2 output2, ...
        io.input.forEach((_, i) => container.appendChild(this.createCaseNode(io.input[i], io.output[i])));
    },
}