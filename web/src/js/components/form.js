// Form class: a form with inputs and buttons
// const form = new Form(DOMElement);
// Methods:
//   - getButton(id): get a button from the form
//   - getInput(id): get an input from the form
//   - validate(validationArray): validate inputs in the form
//     Example:
//         const form = new Form(document.querySelector('#my-form'));
//         form.validate([
//             { id: 'email', rule: e => e.value.includes('@'), message: 'E-mail inválido' },
//             { id: 'password', rule: e => e.value.length >= 8, message: 'Senha muito curta' },
//         ]);
//  - get(): get an arbitrary element from the form
//  - submit(callback): add a callback to the form's submit event
//  - setData(data): set data to the form. This is useful to set data to inputs that are not in the DOM
//  - clear(): clear the form

import Select from './select.js';
import Button from './button.js';
import Input from './input.js';

export default class Form {

    buttons = {};
    inputs = {};
    selects = {};

    static VALIDATION_RULES = {
        EMAIL: e => e.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/),
    };
    
    constructor(element) {
        this.dom = element;

        // add buttons and inputs to the form. Use Button and Input classes for each element
        this.buttons = Object.fromEntries(Array.from(element.querySelectorAll('button')).map(e => [e.id, new Button({ element: e })]));
        
        element.querySelectorAll('input, textarea').forEach(e => {
            // regular id
            if (e.id) {
                this.inputs[e.id] = new Input(e);
                return;
            }
            // have name but no id
            if (e.name && !this.inputs[e.name]) {
                this.inputs[e.name] = [];
            }
            this.inputs[e.name].push(new Input(e));
        });
        this.selects = Object.fromEntries(Array.from(element.querySelectorAll('select')).map(e => [e.id, new Select(e)]));

        // for every input, add the default behavior of clicking the default button when pressing enter
        this.getInput().forEach((input,i) => {
            // check if the input is not a textarea
            if ( input.get().tagName == 'TEXTAREA' || input.get().type == 'checkbox' ) return;
            if (this.dom.tagName == 'FORM') return;
            
            input.keyPress(e => {
                if (e.key == 'Enter') {
                    const defButton = this.getButton().find(e => e.get().classList.contains('default'));
                    if (defButton.get().getAttribute('type') == 'submit') return;
                    defButton.click();
                }
            });
        });

        // focus on the first input
        if (this.getInput().length && this.getInput()[0].get()) {
            this.getInput()[0].get().focus();
        }
    }

    // validate every input in the form
    // validationArray: array of objects with the following structure:
    //   - id: id of the input to be validated
    //   - rule: callback that should return true if the input is valid
    //   - message: message to be displayed if the input is invalid
    validate(validationArray, {
        silent = false,
        returnList = false,
    }={}) {
        // response object: contains the total of valid and invalid inputs and a list of the ids of each
        const response = {
            success: { total: 0, list: []},
            fail: { total: 0, list: []},
        };

        for (let i in validationArray) {
            const { id, rule, message } = validationArray[i];

            let inputs = this.getInput(id) || this.getSelect(id);
            if (!inputs) continue;

            if (!Array.isArray(inputs)) {
                inputs = [inputs];
            }
            
            let fail = false;
            for (let i in inputs) {
                const input = inputs[i];
                // passed validation
                // call the rule callback and check if it returns true
                if (rule(input.value, this.inputs)) {
                    input.clearError();
                    response.success.total++;
                    response.success.list.push(id);
                }
                else {
                    // failed validation
                    if (!silent) {
                        input.setError(message);
                    }
                    response.fail.total++;
                    response.fail.list.push(id);
                    // console.log(response);
                    fail = true;
                    break;
                }
        
            }

            if (fail) {
                break;
            }
            
        }

        if (returnList === true) {
            return response;
        }
        return response.fail.total == 0;
    }

    // get all buttons or a specific button in the form
    getButton(id) {
        if (!id) {
            return Object.values(this.buttons);
        }
        return this.buttons[id] || false;
    }

    // get all inputs or a specific input in the form
    getInput(id) {
        if (!id) {
            return Object.values(this.inputs);
        }
        return this.inputs[id] || false;
    }

    // get all selects or a specific select in the form
    getSelect(id) {
        if (!id) {
            return Object.values(this.selects);
        }
        return this.selects[id] || false;
    }

    // get any element in the form
    get(selector) {
        if (!selector) return this.dom;
        return this.dom.querySelector(selector);
    }

    // add a callback to the form's submit event
    submit(callback, { reset = false }={}) {
        
        // remove current submit event
        this.dom.removeEventListener('submit', e => e.preventDefault());

        // add new submit event
        this.dom.addEventListener('submit', async e => {
            e.preventDefault();

            const fd = new FormData(this.dom);

            // check for inputs outside of the dom
            for (let id in this.inputs) {
                if (fd.has(id)) continue;
                fd.append(id, this.inputs[id].value);
            }

            let data = {};
            for (let name of fd.entries()) {
                // console.log(name);
                if (!data[name[0]]) {
                    data[name[0]] = name[1];
                    continue;
                }

                if (!Array.isArray(data[name[0]])) {
                    data[name[0]] = [data[name[0]]];
                }
                data[name[0]].push(name[1]);
            }

            // select button type submit
            const button = this.getButton().find(e => e.get().type == 'submit');
            
            try {
                button.disable();
                await callback(data);
                button.enable();
            }
            catch (e) {
                button.enable();
                throw e;
            }

            if (reset) {
                this.dom.reset();
            }

        });
    }

    setData(data) {
        for (let id in data) {
            if (this.inputs[id]) {
                this.inputs[id].setValue(data[id]);
                continue;
            }

            const input = new Input(null, { abstract: true, id, value: data[id]});
            this.inputs[id] = input;
        }
    }

    clear() {
        this.dom.reset();

        for (let id in this.inputs) {
            if (Array.isArray(this.inputs[id])) {
                this.inputs[id].forEach(e => e.setValue(''));
                continue;
            }
            this.inputs[id].setValue('');
        }
    }
}