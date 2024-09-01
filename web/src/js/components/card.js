// Card class: create a card element with icon, title, description and custom class
// USAGE: new Card(container, { id, icon, title, description, customClass });
//   - container: parent element to append the card
//   - id: id of the card element
//   - icon: icon class to be added in the card head
//   - title: title of the card. It will be added in the card body
//   - description: description of the card. It will be added in the card body
//   - customClass: custom class to be added in the card element
// Methods:
//   - get(): return the card element
//   - addClass(className): add a class (or array os classes) to the card element
//   - removeClass(className): remove a class from the card element
//   - toggleClass(className): toggle a class in the card
//   - click(callback): add a click event to the card


export default class Card {
    constructor(container, { id, icon, title, description, customClass }) {
        container.classList.add('card-container');

        this.element = document.createElement('div');
        this.element.classList.add('card');

        const headElement = document.createElement('div');
        headElement.classList.add('head');
        if (icon) {
            headElement.innerHTML = `<i class="${ icon }"></i>`;
        }
        this.element.appendChild(headElement);

        const bodyElement = document.createElement('div');
        bodyElement.classList.add('body');

        if (title) {
            const titleElement = document.createElement('div');
            titleElement.classList.add('title');
            titleElement.innerHTML = title;
            if (icon) {
                bodyElement.appendChild(titleElement);
            }
            else {
                headElement.appendChild(titleElement);
            }
        }

        if (description) {
            const descriptionElement = document.createElement('div');
            descriptionElement.classList.add('description');
            descriptionElement.innerHTML = description;
            bodyElement.appendChild(descriptionElement);
        }

        this.element.appendChild(bodyElement);

        if (customClass) {
            if (!Array.isArray(customClass)) {
                customClass = [customClass];
            }
            customClass.map(className => this.addClass(className));
        }

        if (id) {
            this.element.id = id;
        }

        container.appendChild(this.element);
    }

    get(selector) {
        if (selector) {
            return this.element.querySelector(selector);
        }
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