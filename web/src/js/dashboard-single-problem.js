import Button from './components/button.js';
import Modal from './components/modal.js';
import Toast from './components/toast.js';
import Problem from './model/problem.js'

export default {

    load: async function({hash}) {
        const problem = await new Problem({ hash }).get().catch(() => location.href = '/problems');
        // console.log(problem);

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
            <div id="hidden-codes"></div>
            <div id="share">
                <h3>${this.translate('share-section', 'problem')}</h3>
                <div class="links">
                    <div class="facebook">
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${location.href}" target="_blank"><i class="fab fa-facebook"></i></a>
                    </div>
                    <div class="twitter">
                        <a href="https://twitter.com/intent/tweet?url=${location.href}" target="_blank"><i class="fab fa-x-twitter"></i></a>
                    </div>
                    <div class="whatsapp">
                        <a href="https://wa.me/?text=${location.href}" target="_blank"><i class="fab fa-whatsapp"></i></a>
                    </div>
                    <div class="link">
                        <i class="fas fa-link"></i>
                    </div>
                    <div class="qr">
                        <i class="fas fa-qrcode"></i>
                    </div>
                    <div class="pdf">
                        <i class="fas fa-file-pdf"></i>
                    </div>
                </div>
                    
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

        // add link actions
        frame.querySelector('#share .link').addEventListener('click', () => {
            navigator.clipboard.writeText(location.href);
            new Toast(this.translate('copy-link', 'problem'), { type: 'success' });
        });
        frame.querySelector('#share .qr').addEventListener('click', () => {
            const img = document.createElement('img');
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${location.href}`;
            img.alt = 'QR Code';
            const modal = new Modal(`<i class="fa-solid fa-spinner fa-spin-pulse"></i>`, { id: 'qr' });
            const content = modal.get('#content');
            content.classList.add('loading');
            img.onload = () => {
                content.innerHTML = '';
                modal.append(img);
                content.classList.remove('loading');
            }
        });
        frame.querySelector('#share .pdf').addEventListener('click', async () => {
            try {
                const blob = await this.problem.getPDF({
                    input: this.translate('input_samples', 'problem'),
                    output: this.translate('output_samples', 'problem'),
                    'header.title': '',
                    'header.subtitle': '',
                });
                const pdf = URL.createObjectURL(blob);
                window.open(pdf);
            }
            catch (error) {
                console.error(error);
                new Toast(error.message, { type: 'error' });
            }
        });

        // do not add hidden cases if the problem has no author
        // also do not add editable fields
        if (!this.problem.author) return;

        // button for adding a new public case: only visible to the author
        const buttonAddCase = new Button({ id: 'add-case', customClass: 'new-case', text: this.translate('add-case', 'problem'), callback: () => {
            // do not add a new case if there is already one being created
            if (publicCodes.querySelector('.create')) return;
            codeContainerPublic.appendChild(this.createCaseNode());
            // hide all buttons
            frame.querySelectorAll('button').forEach(b => b.classList.add('hidden'));
            frame.querySelector('.code.create .input').focus();
        }});
        publicCodes.appendChild(buttonAddCase.get());

        // add hidden cases: hidden test cases are only visible to the author
        const hiddenCodes = frame.querySelector('#problem #hidden-codes');
        hiddenCodes.innerHTML = `<h3>${this.translate('inout', 'problem', {count: inputLength(this.problem.inputHidden), hidden: this.translate('hidden', 'problem')})}</h3>`;
        const codeContainerHidden = document.createElement('div');
        codeContainerHidden.classList.add('code-container');
        // render the cases in the container
        this.renderCases(codeContainerHidden, this.problem.inputHidden, this.problem.outputHidden);
        hiddenCodes.appendChild(codeContainerHidden);

        // button for adding a new hidden case: only visible to the author
        const buttonAddHidden = new Button({ id: 'add-hidden', customClass: 'new-case', text: this.translate('add-hidden', 'problem'), callback: () => {
            // do not add a new case if there is already one being created
            if (hiddenCodes.querySelector('.create')) return;
            codeContainerHidden.appendChild(this.createCaseNode());
            frame.querySelectorAll('button').forEach(b => b.classList.add('hidden'));
            frame.querySelector('.code.create .input').focus();
        }});
        hiddenCodes.appendChild(buttonAddHidden.get());

        // add editable fields: fields like title and description are editable by the author
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
                field.contentEditable = 'plaintext-only';
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

                // do not save if the content is the same
                if (oldContent === field.textContent) return;

                // do not save if the content is empty
                if (!field.textContent) {
                    field.textContent = oldContent;
                    return;
                }

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
            await this.problem.update({ [field]: content })//.catch(() => location.reload());
            // console.log(resp);
            new Toast(this.translate('save-changes.success', 'problem'), { type: 'success' });
        }
        catch (error) {
            console.error(error);
            new Toast(error.message, { type: 'error' });
        }
    },

    createCaseNode: function(input, output, ) {
        // check if the it is an existing case or a new one
        const isCreate = !input && !output && this.problem.author;

        const code = document.createElement('div');
        code.classList.add('code');

        code.innerHTML = `
            <div class="case-container">
                <div class="case">
                    <span class="label">${this.translate('input', 'problem')}</span>
                    <span class="value">${input || ''}</span>
                </div>
                <div class="case">
                    <span class="label">${this.translate('output', 'problem')}</span>
                    <span class="value">${output || ''}</span>
                </div>
            </div>
        `;

        if (!this.problem.author) return code;
        
        // controls: add and remove buttons
        const controls = document.createElement('div');
        controls.classList.add('controls');

        // remove button: to discard the new case or remove an existing one
        const buttonRemove = document.createElement('div');
        buttonRemove.classList.add('button', 'remove');
        buttonRemove.title = this.translate('discard', 'common');
        buttonRemove.innerHTML = '<i class="fa-solid fa-trash"></i>';
        buttonRemove.addEventListener('click', async () => {
            if (isCreate) {
                this.render();
                return;
            }
            const modal = new Modal(`
                <h1>${this.translate('remove-case.h1', 'problem')}</h1>
                <p>${this.translate('remove-case.message', 'problem')}</p>
            `)
            .addButton({
                text: this.translate('remove', 'common'),
                close: true,
                isDefault: false,
                callback: async () => {
                    const isPublic = code.closest('#public-codes') ? true : false;
                    await this.removeCase(input, output, isPublic);
                    this.render();
                }
            })
            .addButton({ text: this.translate('cancel', 'common'), close: true, isDefault: true, callback: () => {
                this.render();
            } });
        });

        // append the buttons to the controls
        controls.appendChild(buttonRemove);
        code.appendChild(controls);

        if (isCreate) {
            code.classList.add('create');

            // input field: where the user writes new the input
            const inputField = document.createElement('span');
            inputField.classList.add('input');
            inputField.contentEditable = 'plaintext-only';
            inputField.setAttribute('placeholder', this.translate('new-case-value', 'problem', { inout: this.translate('input', 'common') }));

            // output field: where the user writes new the output
            const outputField = document.createElement('span');
            outputField.classList.add('input');
            outputField.contentEditable = 'plaintext-only';
            outputField.setAttribute('placeholder', this.translate('new-case-value', 'problem', { inout: this.translate('output', 'common') }));

            // append the fields to the cases
            const caseContainers = code.querySelectorAll('.case');
            caseContainers[0].appendChild(inputField);
            caseContainers[1].appendChild(outputField);


            // add button: to persist the new case
            const buttonAdd = document.createElement('div');
            buttonAdd.classList.add('button', 'add');
            buttonAdd.title = this.translate('add-case', 'problem');
            buttonAdd.innerHTML = '<i class="fa-solid fa-check"></i>';
            buttonAdd.addEventListener('click', async () => {
                // do not add a case if the fields are empty
                if (!inputField.textContent || !outputField.textContent) {
                    new Toast(this.translate('empty-case', 'problem'), { type: 'error' });
                    return;
                }

                const isPublic = code.closest('#public-codes') ? true : false;
                await this.addCase(inputField.textContent, outputField.textContent, isPublic);
                this.render();
            });
            controls.appendChild(buttonAdd);
        }

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

    addCase: async function(input, output, isPublic) {
        return this.updateCase('add', input, output, isPublic);
    },

    removeCase: async function(input, output, isPublic) {
        return this.updateCase('remove', input, output, isPublic);
    },

    updateCase: async function(operation, input, output, isPublic) {
        let newInput = isPublic ? this.problem.input : this.problem.inputHidden;
        newInput = newInput ? JSON.parse(newInput) : [];

        let newOutput = isPublic ? this.problem.output : this.problem.outputHidden;
        newOutput = newOutput ? JSON.parse(newOutput) : [];

        if (operation === 'add') {
            if (newInput.includes(input)) {
                new Toast(this.translate('duplicate-case', 'problem'), { type: 'error' });
                return;
            }

            newInput.push(input);
            newOutput.push(output);
        }
        else {
            const index = newInput.indexOf(input);
            newInput.splice(index, 1);
            newOutput.splice(index, 1);
        }

        const toUpdate = {};
        if (isPublic) {
            toUpdate.input = newInput;
            toUpdate.output = newOutput;
        }
        else {
            toUpdate.inputHidden = newInput;
            toUpdate.outputHidden = newOutput;
        }

        try {
            await this.problem.update(toUpdate).catch(() => location.reload());
            // console.log(resp);
            new Toast(this.translate('save-changes.success-case', 'problem', {operation: this.translate(operation === 'add' ? 'added' : 'removed', 'common')}), { type: 'success' });
        }
        catch (error) {
            console.error(error);
            new Toast(error.message, { type: 'error' });
        }
    },

}