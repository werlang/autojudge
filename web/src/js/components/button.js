// Button class: a button in a form
// const button = new Button({
//   element: DOMElement,
//   text: 'Button text',
//   callback: function,
// });

// Methods:
//   - get(): get the DOM element
//   - disable(): disable the button and show a loading icon
//   - enable(): enable the button and show the original text
//   - click(callback): add a click event to the button
//   - addClass(classList): add a class (or an array with classes) to the button
//   - setText(text): set the text of the button
// Example:
//   const button = new Button({ element: document.querySelector('#my-button') });
//   button.click(() => {
//       // do something
//   });

export default class Button {
    constructor({ id, element, text, callback, customClass, icon, title }) {
        this.element = element || document.createElement('button');

        if (icon) {
            text = `<i class="fa-solid fa-${ icon }"></i> ${ text || '' }`;
        }
        if (text) {
            this.element.innerHTML = text;
        }

        if (title) {
            this.element.setAttribute('title', title);
        }

        if (callback) {
            this.click(callback);
        }

        if (customClass) {
            this.addClass(customClass);
        }

        if (id) {
            this.element.id = id;
        }

        if (this.element.disabled) {
            this.disable(false);
        }
    }

    get() {
        return this.element;
    }

    setText(text) {
        this.element.innerHTML = text;
        return this;
    }

    // disable the button and show a loading icon
    disable(spin = true) {
        if (this.isDisabled) return this;
        this.element.setAttribute('disabled', true);
        this.oldHTML = this.element.innerHTML;
        if (spin) {
            this.element.innerHTML = '<i class="fa-solid fa-spinner fa-spin-pulse"></i>';
        }
        this.isDisabled = true;
        return this;
    }

    // enable the button and show the original text
    enable() {
        if (!this.isDisabled) return this;
        this.element.innerHTML = this.oldHTML;
        this.element.removeAttribute('disabled');
        this.isDisabled = false;
        return this;
    }

    // add a click event to the button
    // callback: function to be called when the button is clicked
    click(callback) {
        if (!callback) {
            this.get().click();
            return this;
        }

        // disable the button, call the callback and enable the button again
        this.get().addEventListener('click', async e => {
            if (this.isDisabled) return;
            try {
                this.disable();
                await callback(e, this);
                this.enable();
            }
            catch (e) {
                this.enable();
                throw e;
            }
        });
        return this;
    }

    addClass(classList) {
        if (!Array.isArray(classList)) {
            classList = [classList];
        }
        classList.forEach(c => this.element.classList.add(c));
        return this;
    }
}