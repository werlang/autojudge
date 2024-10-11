import Button from "./components/button.js";
import Modal from "./components/modal.js";
import Table from "./components/table.js";
import Toast from "./components/toast.js";
import Contest from "./model/contest.js";
import iro from '@jaames/iro';

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('problem_other', 'common')}</h1>
            <div id="problems-container"></div>
            <div id="button-container">
                <button id="get-pdf" class="default">${this.translate('pdf-problems', 'problem')}</button>
            </div>
        `;

        const problemsDOM = frame.querySelector('#problems-container');

        const table = new Table({
            element: problemsDOM,
            id: 'problems', 
            columns: [
                { id: 'color', name: this.translate('color', 'common'), size: 'small', sort: false },
                {id: 'title', name: this.translate('title', 'common')},
            ],
            controls: [
                { id: 'color', icon: 'fas fa-palette', title: this.translate('color-modal.hint', 'contest'), action: (s,e) => this.setColor(s) },
                { id: 'open', icon: 'fas fa-external-link-alt', title: this.translate('remove-problem.open', 'contest'), action: s => location.href = `/problems/${s[0].hash}` },
            ],
            selection: { enabled: true, multi: false },
            translate: this.translate,
            search: false,
        });

        const contestInstance = new Contest({ id: this.contest.id });
        const {contest} = await contestInstance.get();
        // console.log(contest);

        table.clear();
        contest.problems.forEach(problem => {
            problem.colorData = problem.color;
            if (problem.color) {
                problem.color = `<div class="color" style="--color-problem: ${problem.color}"></div>`;
            }
            else {
                problem.color = `<div class="color empty"></div>`;
            }
            table.addItem(problem);
        });

        table.addItemEvent('click', item => {
            const selected = table.getSelected();
            const toEnable = [];
            if (selected.length) {
                toEnable.push('color', 'open');
            }
            table.disableControl('color', 'open');
            table.enableControl(...toEnable);
        });
        table.disableControl('color', 'open');

        new Button({ element: frame.querySelector('#get-pdf') }).click(async () => {
            try {
                const blob = await contestInstance.getPDF({
                    input: this.translate('input_samples', 'problem'),
                    output: this.translate('output_samples', 'problem'),
                });
                const pdf = URL.createObjectURL(blob);
                window.open(pdf);
                return;
            }
            catch (error) {
                console.error(error);
                new Toast(error.message, { type: 'error' });
                return;
            }
        });
    },

    setColor: async function(selected) {
        if (selected.length === 0) return;
        const problem = selected[0];
        // console.log(problem);
        
        const modal = new Modal(`
            <h1>${this.translate('color-modal.title', 'contest')}</h1>
            <p>${this.translate('color-modal.message', 'contest')}</p>
            <div id="picker"></div>
        `, { id: 'color-modal' });
            
        const picker = new iro.ColorPicker(modal.get('#picker'), {
            width: 200,
            color: problem.colorData || '#ff0000',
            layoutDirection: 'horizontal',
        });

        modal.addButton({
            id: 'set-color',
            text: this.translate('color-modal.submit', 'contest'),
            isDefault: true,
            callback: async () => {
                await new Contest({ id: this.contest.id }).updateProblem(problem.id, { color: picker.color.hexString });
                new Toast(this.translate('color-modal.success', 'contest'), { type: 'success' });
                modal.close();
                this.build();
            },
        });

        picker.on(['color:init', 'color:change'], color => {
            const button = modal.get('#set-color');
            button.style.setProperty('--color-problem', color.hexString);
        });
    }
}