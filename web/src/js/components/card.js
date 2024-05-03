export default class Card {
    constructor(container, { id, icon, title, description, customClass }) {
        container.classList.add('card-container');

        this.element = document.createElement('div');
        this.element.classList.add('card');

        if (icon) {
            const headElement = document.createElement('div');
            headElement.classList.add('head');
            headElement.innerHTML = `<i class="${ icon }"></i>`;
            this.element.appendChild(headElement);
        }

        const bodyElement = document.createElement('div');
        bodyElement.classList.add('body');

        if (title) {
            const titleElement = document.createElement('div');
            titleElement.classList.add('title');
            titleElement.innerHTML = title;
            bodyElement.appendChild(titleElement);
        }

        if (description) {
            const descriptionElement = document.createElement('div');
            descriptionElement.classList.add('description');
            descriptionElement.innerHTML = description;
            bodyElement.appendChild(descriptionElement);
        }

        this.element.appendChild(bodyElement);

        if (customClass) {
            this.addClass(customClass);
        }

        if (id) {
            this.element.id = id;
        }

        container.appendChild(this.element);
    }

    get() {
        return this.element;
    }

    addClass(className) {
        this.element.classList.add(className);
        return this;
    }

    removeClass(className) {
        this.element.classList.remove(className);
        return this;
    }

    toggleClass(className) {
        this.element.classList.toggle(className);
        return this;
    }

    click(callback) {
        if (!callback) {
            this.element.click();
            return this;
        }

        this.element.addEventListener('click', callback);
        return this;
    }
}