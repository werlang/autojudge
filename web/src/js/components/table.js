export default class Table {

    placeholderAmount = 10;

    constructor({ element, id, columns }) {
        this.columns = columns;
        this.domElement = document.createElement('div');
        this.domElement.id = id;
        this.domElement.classList.add('table');
        this.domElement.style.setProperty('--column-width', `${(100 / columns.length).toFixed(2)}%`);
        element.appendChild(this.domElement);

        this.createHead();
        this.clear();

        for (let i = 0 ; i < this.placeholderAmount ; i++) {
            const item = {};
            this.columns.forEach(column => {
                // placeholder name
                const name = '000000000000000000000000000000'.slice(parseInt(Math.random() * 25));
                item[column.id] = `<span>${name}</span>`;
            });
            this.addItem({ ...item, customClass: 'placeholder' });
        }
    }

    createHead() {
        const columns = this.columns.map(column => `<div class="column ${column.id || ''}"><div class="button"><i class="fa-solid fa-arrow-down-a-z"></i></div>${column.name}</div>`).join('');

        this.head = document.createElement('div');
        this.head.classList.add('head');
        this.head.innerHTML = `
            <div class="columns">${columns}</div>
            <div class="controls">
                <div class="search button" title="Search"><i class="fas fa-search"></i></div>
                <div class="add button" title="Add Problem"><i class="fas fa-plus"></i></div>
            </div>
        `;
    }

    clear() {
        this.domElement.innerHTML = '';
        this.domElement.appendChild(this.head);
    }

    addItem(item) {
        const itemDOM = document.createElement('div');
        itemDOM.classList.add('item');
        if (item.customClass) {
            itemDOM.classList.add(item.customClass);
        }
        itemDOM.innerHTML = this.columns.map(column => `<div class="column ${column.id || ''}">${item[column.id]}</div>`).join('');

        this.domElement.appendChild(itemDOM);
    }

}