import Button from './components/button.js';
import Modal from './components/modal.js';
import Toast from './components/toast.js';
import Problem from './model/problem.js';
import Editor from './components/textEditor.js';
import Uploader from './components/uploader.js';

import '../less/dashboard-single-problem.less';

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
            <div id="permission">
                <span class="switch public">${this.translate('public', 'common')}</span>
                <span class="switch private">${this.translate('private', 'common')}</span>
            </div>
            <h1 id="title">${this.problem.title}</h1>
            <div id="description">${this.problem.description}</div>
            <div id="public-cases" class="cases-container"></div>
            <div id="hidden-cases" class="cases-container"></div>
            <div id="import-cases-container"></div>
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
                        <a href="/problems/${this.problem.hash}/pdf" target="_blank"><i class="fas fa-file-pdf"></i></a>
                    </div>
                </div>
                    
            </div>`;

        // add public cases: public test cases are always visible
        const publicCases = frame.querySelector('#problem #public-cases');
        publicCases.innerHTML = `<h3>${this.translate('inout-public', 'problem', {count: inputLength(this.problem.input)})}</h3>`;
        // create a container for the cases
        const codeContainerPublic = document.createElement('div');
        codeContainerPublic.classList.add('code-container');
        // render the cases in the container
        this.renderCases(codeContainerPublic, this.problem.input, this.problem.output);
        publicCases.appendChild(codeContainerPublic);

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

        const permissionContainer = frame.querySelector('#permission');
        permissionContainer.querySelector(`.switch.${this.problem.public ? 'public' : 'private'}`).classList.add('selected');

        // do not add hidden cases if the problem has no author
        // also do not add editable fields
        if (!this.problem.author) return;

        // change the permission of the problem to public or private: only visible to the author
        permissionContainer.classList.add('active');
        permissionContainer.querySelectorAll('.switch').forEach(s => s.addEventListener('click', async e => {
            const isPublic = e.target.classList.contains('public');
            if (isPublic === this.problem.public) return;

            try {
                await this.problem.update({ public: isPublic });
                new Toast(this.translate('save-changes.success', 'problem'), { type: 'success' });
                permissionContainer.querySelector('.selected').classList.remove('selected');
                e.target.classList.add('selected');
            }
            catch (error) {
                console.error(error);
                new Toast(error.message, { type: 'error' });
            }
        }));

        // button for adding a new public case: only visible to the author
        const buttonAddCase = new Button({
            id: 'add-case',
            customClass: 'new-case',
            text: this.translate('add-case', 'problem'),
            callback: () => {
                // do not add a new case if there is already one being created
                if (publicCases.querySelector('.create')) return;
                codeContainerPublic.appendChild(this.createCaseNode());
                // hide all buttons
                frame.querySelectorAll('button.new-case').forEach(b => b.classList.add('hidden'));
                frame.querySelector('.code.create .input').focus();
            }
        });
        publicCases.appendChild(buttonAddCase.get());

        // add hidden cases: hidden test cases are only visible to the author
        const hiddenCases = frame.querySelector('#problem #hidden-cases');
        hiddenCases.innerHTML = `<h3>${this.translate('inout-hidden', 'problem', {count: inputLength(this.problem.inputHidden)})}</h3>`;
        const codeContainerHidden = document.createElement('div');
        codeContainerHidden.classList.add('code-container');
        // render the cases in the container
        this.renderCases(codeContainerHidden, this.problem.inputHidden, this.problem.outputHidden);
        hiddenCases.appendChild(codeContainerHidden);

        // button for adding a new hidden case: only visible to the author
        const buttonAddHidden = new Button({
            id: 'add-hidden',
            customClass: 'new-case',
            text: this.translate('add-hidden', 'problem'),
            callback: () => {
                // do not add a new case if there is already one being created
                if (hiddenCases.querySelector('.create')) return;
                codeContainerHidden.appendChild(this.createCaseNode());
                frame.querySelectorAll('button.add-case').forEach(b => b.classList.add('hidden'));
                frame.querySelector('.code.create .input').focus();
            }
        });
        hiddenCases.appendChild(buttonAddHidden.get());

        // add import cases button: only visible to the author
        this.createImportCases();

        // add editable fields: fields like title and description are editable by the author
        this.createEditableFields();
    },

    createImportCases: function() {
        const container = document.querySelector('#import-cases-container');
        const buttonImport = new Button({
            id: 'import-cases',
            text: this.translate('import-cases.title', 'problem'),
            customClass: 'default',
        });
        container.appendChild(buttonImport.get());
        const sampleJson = [
            `Case,Public,Input,Output`,
            `0,1,single line input 1,single output`,
            `1,1,single line input 2,multiline output line 1`,
            `1,1,,multiline output line 2`,
            `2,0,multiline input line 1,single output`,
            `2,0,multiline input line 2,`,
            `3,0,"input, with, comma",output`,
        ];
        buttonImport.click(() => {
            const modal = new Modal(`
                <h1>${this.translate('import-cases.title', 'problem')}</h1>
                <p>${this.translate('import-cases.description', 'problem')}</p>
                <div class="tabs">
                    <nav class="tab-list">
                        <button id="image" class="tab active">${this.translate('import-cases.image', 'problem')}</button>
                        <button id="sample" class="tab">${this.translate('import-cases.sample', 'problem')}</button>
                    </nav>
                    <div class="tab-content">
                        <div class="tab-pane active" id="image">
                            <img src="/assets/img/import-csv-problem.webp" alt="Import cases">
                        </div>
                        <div class="tab-pane" id="sample">
                            <pre><code>${sampleJson.join('\n')}</code></pre>
                        </div>
                    </div>
                </div>
                <div class="uploader"></div>
            `, { id: 'import-cases' });

            // Add event listeners for tabs
            modal.get('.tab-list').addEventListener('click', (e) => {
                if (e.target.classList.contains('tab')) {
                    const tabs = modal.getAll('.tab');
                    const panes = modal.getAll('.tab-pane');
                    tabs.forEach(tab => tab.classList.remove('active'));
                    panes.forEach(pane => pane.classList.remove('active'));
                    e.target.classList.add('active');
                    modal.get(`.tab-content #${e.target.id}`).classList.add('active');
                }
            });
            modal.addButton({ text: this.translate('cancel', 'common'), close: true, isDefault: true });

            // add import cases: import test cases from a file
            const uploader = new Uploader(modal.get('.uploader'), {
                placeholder: this.translate('import-cases.placeholder', 'problem'),
                translate: this.translate,
                accept: '.csv',
                format: 'text',
                onUpload: async (file, data) => {
                    // console.log(file, data);
                    if (data.accepted === false) return;
        
                    const cases = this.parseCases(file);
                    if (!cases.length) {
                        uploader.setError();
                        return;
                    }

                    for (let i in cases) {
                        const caseData = cases[i];
                        await this.addCase(caseData.input, caseData.output, caseData.isPublic);
                    }
                    modal.close();
                    this.render();
                },
                onError: () => {
                    new Toast(this.translate('import-cases.error', 'problem'), { type: 'error', timeOut: 10000 });
                },
            });
        });
    },

    parseCases: function(file) {
        // parse the csv file
        const cases = file.split('\n').map(line => {
            // remove \r
            line = line.replace('\r', '');
            const values = [];
            let inQuotes = false;
            let value = '';
            for (let char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                }
                else if (char === ',' && !inQuotes) {
                    values.push(value);
                    value = '';
                }
                else {
                    value += char;
                }
            }
            values.push(value);
            return values;
        });
        // console.log(cases);

        // validate the csv
        const casesValidate = [...cases];
        let header = casesValidate.shift();
        // check first line for the headers
        if (header.join(',').toLowerCase() !== 'case,public,input,output') {
            new Toast(this.translate('import-cases.error-header', 'problem'), { type: 'error' });
            return [];
        }
        // check each line for the correct number of columns and content type
        for (let i in casesValidate) {
            const caseData = casesValidate[i];
            if (caseData.length !== 4) {
                new Toast(this.translate('import-cases.error-columns', 'problem', {line: parseInt(i) + 2}), { type: 'error' });
                return [];
            }
            if (isNaN(caseData[0]) || caseData[0] == '' || isNaN(caseData[1])) {
                new Toast(this.translate('import-cases.error-type', 'problem', {line: parseInt(i) + 2}), { type: 'error' });
                return [];
            }
        }

        const groupedCases = []
        cases.forEach((caseData, i) => {
            // skip the header
            if (i === 0) return;

            const index = parseInt(caseData[0]);
            if (!groupedCases[index]) {
                groupedCases[index] = [];
            }
            groupedCases[index].push(caseData);
        });
        const groupedMergedCases = [];
        groupedCases.forEach((group,i) => {
            groupedMergedCases.push({
                isPublic: group[0][1] === '1',
                input: group.map(g => g[2]).filter(e => e).join('\n'),
                output: group.map(g => g[3]).filter(e => e).join('\n'),
            });
        });
        // console.log(groupedMergedCases);
        return groupedMergedCases;
    },

    createEditableFields: function() {
        document.querySelectorAll('#title, #description').forEach(e => {
            const content = e.innerHTML;
            e.innerHTML = `<div class="editable">
                <span class="field"><div>${content}</div></span>
                <div class="controls">
                    <button class="edit-icon" title="${this.translate('edit', 'common')}"><i class="fa-solid fa-edit"></i></button>
                    <button class="button cancel hidden" title="${this.translate('cancel', 'common')}"><i class="fa-solid fa-times"></i></button>
                    <button class="button confirm hidden" title="${this.translate('confirm', 'common')}"><i class="fa-solid fa-check"></i></button>
                </div>
            </div>`;

            // bind events
            const editable = e.querySelector('.editable');
            const field = e.querySelector('.field');
            
            let oldContent = field.innerHTML;

            // click the icon
            const editIcon = new Button({ element: editable.querySelector('.controls .edit-icon') });
            const confirmIcon = new Button({ element: editable.querySelector('.controls .confirm') });
            const cancelIcon = new Button({ element: editable.querySelector('.controls .cancel') });

            editIcon.click(() => {
                if (editIcon.editing) return;

                confirmIcon.get().classList.remove('hidden');
                cancelIcon.get().classList.remove('hidden');
                editIcon.get().classList.add('hidden');

                oldContent = field.innerHTML;
                editIcon.get().classList.add('editing');
                editIcon.editing = true;

                field.innerHTML = '';

                this.editor = new Editor({
                    mode: editable.parentNode.id === 'title' ? 'text' : 'html',
                    element: field,
                    content: oldContent,
                    translate: this.translate,
                    uploadImageCallback: async file => new Problem(this.problem).saveImage(file),
                    getImageCallback: async id => new Problem(this.problem).getImageURL(id),
                });
            });

            // click the cancel button
            cancelIcon.click(() => {
                // Show discard changes modal
                new Modal(`
                    <h1>${this.translate('discard-changes.h1', 'problem')}</h1>
                    <p>${this.translate('discard-changes.message', 'problem', {
                        field: this.translate(`field.${editable.parentNode.id}`, 'problem'),
                    })}</p>
                `)
                // Discard changes
                .addButton({
                    text: this.translate('discard', 'common'),
                    close: true,
                    isDefault: false,
                    callback: () => {
                        field.innerHTML = oldContent;
                        confirmIcon.get().classList.add('hidden');
                        cancelIcon.get().classList.add('hidden');
                        editIcon.get().classList.remove('hidden');
                        editIcon.get().classList.remove('editing');
                        editIcon.editing = false;
                        this.editor.destroy();
                    },
                })
                // Cancel
                .addButton({
                    text: this.translate('cancel', 'common'),
                    close: true,
                    isDefault: true,
                });
            });

            // click the confirm button
            confirmIcon.click(() => {
                // Show save changes modal
                new Modal(`
                    <h1>${this.translate('save-changes.h1', 'problem')}</h1>
                    <p>${this.translate('save-changes.message', 'problem', {
                        field: this.translate(`field.${editable.parentNode.id}`, 'problem'),
                    })}</p>
                `)
                // Save changes
                .addButton({
                    text: this.translate('save', 'common'),
                    close: true,
                    isDefault: false,
                    callback: async () => {
                        let newContent = this.editor.getContent();
                        // Do not save if the content is the same
                        if (oldContent === newContent || !newContent) {
                            this.editor.destroy();
                            this.render();
                            return;
                        } 
                        
                        confirmIcon.disable();
                        cancelIcon.disable();
                        await this.saveChanges(editable.parentNode.id, newContent);
                        this.editor.destroy();
                        confirmIcon.enable();
                        cancelIcon.enable();
                        this.render();
                    },
                })
                // cancel
                .addButton({
                    text: this.translate('cancel', 'common'),
                    close: true,
                    isDefault: true,
                });
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
        const buttonRemove = new Button({
            icon: 'trash',
            title: this.translate('discard', 'common'),
            customClass: ['remove', 'button'],
            callback: async () => {
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
                        buttonRemove.disable();
    
                        const isPublic = code.closest('#public-cases') ? true : false;
                        await this.removeCase(input, output, isPublic);

                        buttonRemove.enable();
                        this.render();
                    }
                })
                .addButton({ text: this.translate('cancel', 'common'), close: true, isDefault: true, callback: () => {
                    this.render();
                } });
            },
        });

        // append the buttons to the controls
        controls.appendChild(buttonRemove.get());
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
            const buttonAdd = new Button({
                icon: 'check',
                title: this.translate('add-case', 'problem'),
                customClass: ['add', 'button'],
                callback: async () => {
                    // do not add a case if the fields are empty
                    if (!inputField.innerHTML || !outputField.innerHTML) {
                        new Toast(this.translate('empty-case', 'problem'), { type: 'error' });
                        return;
                    }

                    buttonRemove.disable();
                    const isPublic = code.closest('#public-cases') ? true : false;
                    await this.addCase(inputField.innerHTML, outputField.innerHTML, isPublic);
                    buttonRemove.enable();
                    this.render();
                }
            });
            controls.appendChild(buttonAdd.get());
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
        // all kinds of line breaks are replaced by \n
        input = input.replace(/(\r\n|\r|\n|<br\s*\/?>)/g, '\n');
        output = output.replace(/(\r\n|\r|\n|<br\s*\/?>)/g, '\n');
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
            new Toast(this.translate('save-changes.success-case', 'problem', {operation: this.translate(operation === 'add' ? 'added' : 'removed', 'common')}), { type: 'success' });
        }
        catch (error) {
            console.error(error);
            new Toast(error.message, { type: 'error' });
        }
    },

}