// Modal class: a window that open in front of the screen
// Options:
//   - id: put an id to the modal window
//   - large: modal window will have higher width
//   - fog.close: clicking the fog will remove the modal. default true
//   - fog.dark: fog will be black
//   - fog.invisible: fog will be invisible
//   - buttonClose: id of the button that will close the modal
// Methods:
//   - addEvent({ id, event, callback }): add an event to the modal
//   - close(): close the modal
//   - get(selector): get an element inside the modal, or the modal itself if no selector is provided
//   - getAll(selector): get all elements inside the modal
//   - addButton({ id, text, callback, close = false, isDefault = true }): add a button to the modal
//   - append(element): append an element to the modal (can be a string or a DOM element)
//   - onClose(callback): set a callback to be called when the modal is closed
//   - addInput({ id, type, placeholder, value, label, required, disabled }): add an input to the modal
//   - loadContent(file): load an HTML file to the modal
// Example:
//   const modal = new Modal(`<h1>Hello World</h1><button id='my-button'>Click me</button>`, { id: 'my-modal' });
//   modal.addEvent({ id: 'my-button', event: 'click', callback: () => alert('Hello World') });

import Button from './button.js';
import HTMLLoader from '../helpers/html-loader.js';
import Input from './input.js';

export default class Modal {
    constructor(text, options = {}) {
        if (!text) {
            text = '';
        }

        // remove previous modal
        if (document.querySelector('#fog.modal')){
            document.querySelector('#fog.modal').remove();
        }

        // place content in the modal
        const fog = document.createElement('div');
        fog.id = 'fog';

        if (typeof text === 'string') {
            fog.innerHTML = `<div class='modal'><div id="content">${text}</div></div>`;
        }
        else if (typeof text === 'object') {
            fog.innerHTML = `<div class='modal'><div id="content"></div></div>`;
            fog.querySelector('#content').appendChild(text);
        }

        this.domObject = fog.querySelector('.modal');
        if (options.id){
            this.domObject.id = options.id;
        }
        // large is for a larger than normal modal
        if (options.large){
            this.domObject.classList.add('large');
        }

        // fogClose is for clicking the fog to close the modal
        this.fogClose = options.fog ? (options.fog.close || false) : true;
        if (this.fogClose){
            fog.addEventListener('click', () => this.close());
            fog.querySelector('div').addEventListener('click', e => e.stopPropagation());
        }

        // dark fog
        if (options.fog && options.fog.dark){
            fog.classList.add('dark');
        }

        // invisible fog
        if (options.fog && options.fog.invisible){
            fog.classList.add('invisible');
        }

        // inform the id of the button that will close the modal
        if (options.buttonClose){
            fog.querySelector(`#${options.buttonClose}`).addEventListener('click', () => this.close());
        }

        document.body.appendChild(fog);
        this.fadeIn(500);

        // add events
        if (options.events){
            options.events.forEach(event => {
                this.addEvent(event);
            })
        }
    }

    // add events to the modal
    // myModal.addEvent({ id|class, event, callback })
    //   - id: id of the element (modal's child) to add the event
    //   - class: class of the element (modal's child) to add the event
    //   - event: click, change, etc
    //   - callback(e, modal): function to be called when the event is triggered
    //     - e: event object
    //     - modal: modal object. A way to access the modal from the callback
    addEvent(event){
        let selector = '';
        let attr = event.tag;
        if (event.id){
            selector = '#';
            attr = event.id;
        }
        else if (event.class){
            selector = '.';
            attr = event.class;
        }

        const target = this.domObject.querySelectorAll(`${selector}${attr}`);
        if (!target) return this;

        target.forEach(obj => obj.addEventListener(event.event, e => event.callback(e, this)));

        return this;
    }

    // close the modal
    close() {
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
        this.domObject.parentNode.remove();
    }

    // get the modal's dom object
    get(selector) {
        if (!selector) return this.domObject;
        return this.domObject.querySelector(selector);
    }

    getAll(selector) {
        return this.domObject.querySelectorAll(selector);
    }

    // add a button to the modal
    // myModal.addButton({ id, text, callback, close, isDefault })
    //   - id: id of the button
    //   - text: text of the button
    //   - callback: function to be called when the button is clicked
    //   - close: if true, the button will close the modal when clicked
    //   - isDefault: if true, the button will be the default button (red background)
    addButton({ id, text, callback, close = false, isDefault = true, icon, title }) {
        const button = new Button({
            text,
            callback: callback ? e => callback(e, this) : null,
            icon,
            title,
        });

        if (!this.buttonList) {
            this.buttonList = {};
        }
        
        if (id) {
            button.get().id = id;
            this.buttonList[id] = button;
        }

        let container = this.domObject.querySelector('#button-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'button-container';
            this.domObject.querySelector('#content').appendChild(container);
        }
        container.appendChild(button.get());

        if (close) {
            button.get().addEventListener('click', () => this.close());
        }

        if (isDefault) {
            button.get().classList.add('default');
        }

        return this;
    }

    addInput({ id, type, placeholder, value, label, required, disabled }) {
        let input = document.createElement('input');
        input.id = id;
        input.type = type;
        input.placeholder = placeholder || label;
        input.value = value;
        input.required = required;
        input.disabled = disabled;

        input = new Input(input);
        this.append(input.get().parentNode);

        if (!this.inputList) {
            this.inputList = {};
        }
        this.inputList[id] = input;

        return this;
    }

    append(element) {
        if (typeof element === 'string') {
            this.domObject.querySelector('#content').insertAdjacentHTML('beforeend', element);
        }
        else if (typeof element === 'object') {
            this.domObject.querySelector('#content').appendChild(element);
        }
        return this;
    }

    onClose(callback) {
        this.onCloseCallback = callback;
        return this;
    }

    fadeIn(time=300) {
        const elem = this.domObject.parentNode;
        return new Promise(resolve => {
            const oldStyle = elem.getAttribute('style');
            elem.style.transition = `${time/1000}s opacity`;
            elem.style.opacity = '0';
        
            setTimeout(() => elem.style.opacity = '1', 1);
            setTimeout(() => {
                elem.removeAttribute('style');
                elem.style = oldStyle;
                resolve(true);
            }, time + 100);
        });
    }

    async loadContent(file, vars) {
        const content = this.domObject.querySelector('#content');
        content.classList.add('loading');
        content.innerHTML = `<i class="fa-solid fa-spinner fa-spin-pulse"></i>`;
        const loader = new HTMLLoader(file, vars);
        await loader.load(content);
        content.classList.remove('loading');
        return this;
    }

    getInput(id) {
        return this.inputList[id];
    }

    getButton(id) {
        return this.buttonList[id];
    }
}