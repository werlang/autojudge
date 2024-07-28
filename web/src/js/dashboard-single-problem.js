import Modal from './components/modal.js';
import Toast from './components/toast.js';
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
            <h1 id="title">${this.problem.title}</h1>
            <p id="description">${this.problem.description}</p>
            <h3>${this.translate('inout', 'problem', {count: inputLength(this.problem.input)})}</h3>
            ${codes}
        </div>`;

        if (!this.problem.author) return;
        this.createEditableFields();
    },

    createEditableFields: function() {
        document.querySelectorAll('#title, #description').forEach(e => {
            const content = e.innerHTML;
            e.innerHTML = `<div class="editable" title="${this.translate('edit', 'common')}">
                <span class="field">${content}</span>
                <span class="edit-icon"><i class="fas fa-edit"></i></span>
            </div>`;

            // bind events
            const editable = e.querySelector('.editable');
            const field = e.querySelector('.field');
            
            let oldContent = field.textContent;

            // click the icon
            const editIcon = editable.querySelector('.edit-icon');
            editIcon.addEventListener('click', () => {
                field.contentEditable = true;
                field.focus();
                // select all the text
                window.getSelection().selectAllChildren(field);
                oldContent = field.textContent;

                editIcon.classList.add('editing');
            });

            // leave the field
            field.addEventListener('blur', () => {
                field.contentEditable = false;
                // change the icon
                editIcon.classList.remove('editing');
                editIcon.innerHTML = '<i class="fas fa-edit"></i>';

                if (oldContent === field.textContent) return;

                // show save changes modal
                // console.log(editable.parentNode.id, field.textContent);
                new Modal(`
                    <h1>${this.translate('save-changes.h1', 'problem')}</h1>
                    <p>${this.translate('save-changes.message', 'problem', { field: this.translate(`field.${editable.parentNode.id}`, 'problem')})}</p>
                `)
                // save changes
                .addButton({
                    text: this.translate('save', 'common'),
                    close: true,
                    isDefault: false,
                    callback: () => this.saveChanges(editable.parentNode.id, field.textContent)
                })
                // discard changes
                .addButton({ 
                    text: this.translate('discard', 'common'), 
                    close: true,
                    isDefault: true,
                    callback: () => field.textContent = oldContent
                })

            });
        });
    },

    saveChanges: async function(field, content) {
        try {
            const resp = await new Problem({ id: this.problem.id }).update({ [field]: content });
            // console.log(resp);
            new Toast(this.translate('save-changes.success', 'problem'), { type: 'success' });
            this.problem = resp.problem;
        }
        catch (error) {
            console.error(error);
            new Toast(error.message, { type: 'error' });
        }
    },

}