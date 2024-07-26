import Problem from './model/problem.js'

export default {
    load: async function(id) {
        const {problem} = await new Problem({ id }).get();
        // console.log(problem);

        if (!problem) {
            location.href = '/problems';
            return;
        }

        this.problem = problem;
        this.render();
    },

    render: function() {
        const inputLength = item => item && item.length ? JSON.parse(item).length : 0;
        const getItems = item => item && item.length ? JSON.parse(item) || [] : [];
        const io = {
            input: getItems(this.problem.input),
            output: getItems(this.problem.output)
        };
        const codes = io.input.map((_, i) => `<div class="code">
            ${[Object.keys(io).map(key => `<div class="case">
                <span class="label">${this.translate(key, 'problem')}</span>
                ${io[key][i]}
            </div>`).join('')]}
        </div>`).join('');
        
        const frame = document.querySelector('#frame');
        frame.innerHTML = `<div id="problem">
            <h1>${this.problem.title}</h1>
            <p>${this.problem.description}</p>
            <h3>${this.translate('inout', 'problem', {count: inputLength(this.problem.input)})}</h3>
            ${codes}
        </div>`;
    }

}