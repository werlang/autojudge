// Input class: an input in a form
// const input = new Input(DOMElement);
// Methods:
//   - get(): get the DOM element
//   - setError(message): show an error message and focus the input
//   - clearError(): remove the error message from the input
//   - build(): wrap the input in a div with a label to create a floating label effect. It uses the placeholder attribute as the label text.
//   - keyPress(callback): add a callback to the keypress event
//   - keyUp(callback): add a callback to the keyup event
//   - keyDown(callback): add a callback to the keydown event
//   - input(callback): add a callback to the input event
//   - change(callback): add a callback to the change event
//   - focus(): focus the input
//   - setValue(value): set the input value
//   - disable(): disable the input
//   - enable(): enable the input
//   - setMask(mask): set a mask to the input. The mask is a string with the following characters:
//       - 0: only numbers
//       - X: only uppercase letters
//       - x: only lowercase letters
//       - Any other character: fixed character
// Example:
//   const input = new Input(document.querySelector('#my-input'));
//   input.setError('E-mail inválido');

import Toast from './toast.js';

export default class Input {
    constructor(element, { abstract=false, id, value }={}) {
        this.element = element || document.createElement('input');
        this.element.classList.add('material-input');
        this.value = this.element.value || '';

        if (id) {
            this.setId(id);
        }
        if (abstract === false) {
            this.build();
        }
        if (value) {
            this.setValue(value);
        }
    }

    build() {
        const wrapper = document.createElement('div');
        wrapper.classList.add('material-input');
        this.element.replaceWith(wrapper);
        
        const span = document.createElement('span');
        span.innerHTML = this.element.placeholder;

        if (this.element.type == 'checkbox') {
            const label = document.createElement('label');
            label.classList.add('checkbox');

            if (this.element.disabled) {
                label.classList.add('disabled');
            }

            this.element.addEventListener('change', () => this.setValue(this.element.checked) );
            this.setValue(this.element.checked);

            label.appendChild(this.element);
            label.appendChild(span);
            wrapper.appendChild(label);
            return;
        }

        if (this.element.type == 'date') {
            this.element.classList.add('date');
        }

        span.classList.add('label');
        this.element.placeholder = '';

        wrapper.appendChild(this.element);
        wrapper.appendChild(span);

        this.element.addEventListener('input', () => {
            this.value = this.element.value;
            if (this.element.value) {
                this.element.classList.add('filled');
            }
            else {
                this.element.classList.remove('filled');
            }
        });

        if (this.value) {
            this.setValue(this.value);
        }
    }

    get() {
        return this.element;
    }

    setValue(value) {
        this.element.value = value;
        this.value = value;
        if (this.element.value) {
            this.element.classList.add('filled');
        }
        else {
            this.element.classList.remove('filled');
        }

        this.maskFunction();

        return this;
    }

    setId(id) {
        this.element.id = id;
        this.element.name = id;
        return this;
    }

    setError(message) {
        new Toast(message, { timeOut: 5000, customClass: 'error'});
        this.element.classList.add('error');
        this.element.focus();
    }
    
    clearError() {
        this.element.classList.remove('error');
        return this;    
    }

    keyPress(callback) {
        this.addEvent('keypress', callback);
    }

    keyUp(callback) {
        this.addEvent('keyup', callback);
    }

    keyDown(callback) {
        this.addEvent('keydown', callback);
    }

    input(callback) {
        this.addEvent('input', callback);
    }

    change(callback) {
        this.addEvent('change', callback);
    }

    addEvent(event, callback) {
        this.get().addEventListener(event, e => {
            if (this.element.disabled) return;
            callback(e, this.value, this);
        });
        return this;
    }

    disable() {
        this.element.disabled = true;
        if (this.element.type == 'checkbox') {
            this.element.parentElement.classList.add('disabled');
        }
        return this;
    }

    enable() {
        this.element.disabled = false;
        if (this.element.type == 'checkbox') {
            this.element.parentElement.classList.remove('disabled');
        }
        return this;
    }

    setMask(mask) {
        this.mask = mask;

        this.get().addEventListener('input', () => this.maskFunction() );
        this.get().addEventListener('change', () => this.maskFunction() );

        return this;
    }

    maskFunction() {
        if (!this.mask) return false;

        const value = this.get().value;
        let output = '';
        let j = 0;

        let i;
        for (i = 0 ; i < this.mask.length ; i++) {
            if (j >= value.length) {
                break;
            }

            const maskedChar = this.mask.charAt(i);
            const inputChar = value.charAt(j);

            const masksAvailable = {
                '0': /\d/,
                'X': /[A-Z]/,
                'x': /[a-z]/,
            }

            if (maskedChar === inputChar) {
                output += maskedChar;
            }
            // if the masked char is not in the masksAvailable object, just add it to the output
            else if (!Object.keys(masksAvailable).includes(maskedChar)) {
                output += maskedChar;
                continue;
            }
            // if the input char matches the mask, add it to the output
            else if ( masksAvailable[maskedChar].test(inputChar) ) {
                output += inputChar;
            }

            j++;
        }

        this.get().value = output;
        this.value = output;

        return this;
    }

    focus() {
        this.get().focus();
        return this;
    }

}
