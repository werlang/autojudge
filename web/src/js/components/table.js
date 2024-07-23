import translate from "../helpers/translate.js";

export default class Table {

    placeholderAmount = 10;
    content = [];

    constructor({ element, id, columns, controls }) {
        this.columns = columns;
        this.controls = controls || [];
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
        const columns = this.columns.map(column => {
            const columnDOM = document.createElement('div');
            columnDOM.classList.add('column', column.id || '');
            columnDOM.innerHTML = `${column.name}<div class="button"><i class="fa-solid fa-arrow-down-a-z"></i></div>`;

            const button = columnDOM.querySelector('.button');
            // click the sort button
            button.addEventListener('click', () => {
                // console.log('sort by', column.id, button.sort);
                button.querySelector('i').classList.toggle('fa-arrow-down-a-z');
                button.querySelector('i').classList.toggle('fa-arrow-up-a-z');
                
                // make active only the clicked button
                columns.forEach(c => {
                    c.querySelector('.button i').classList.remove('active');
                });
                button.querySelector('i').classList.add('active');
                
                // sort the content toggle asc/desc
                if (button.sort === 'asc') {
                    button.sort = 'desc';
                    this.content.sort((a, b) => a[column.id] > b[column.id] ? 1 : -1);
                }
                else {
                    button.sort = 'asc';
                    this.content.sort((a, b) => a[column.id] > b[column.id] ? -1 : 1);
                }

                this.render();
            });

            return columnDOM;
        });

        this.head = document.createElement('div');
        this.head.classList.add('head');
        this.head.innerHTML = `
            <div class="columns"></div>
            <div class="controls">
                <div class="search button" title="${translate('table-search-title')}"><i class="fas fa-search"></i><input type="text"></div>
            </div>
        `;

        // add custom controls
        const controlsDOM = this.head.querySelector('.controls');
        this.controls.forEach(control => {
            const controlDOM = document.createElement('div');
            controlDOM.classList.add('button', control.id);
            controlDOM.innerHTML = `<i class="${control.icon}"></i>`;
            controlDOM.addEventListener('click', control.action);
            controlDOM.title = control.title;
            controlsDOM.appendChild(controlDOM);
        });

        this.head.querySelector('.columns').append(...columns);

        // create the search function
        const searchButton = this.head.querySelector('.search');
        const input = searchButton.querySelector('input');
        searchButton.addEventListener('click', () => {
            searchButton.classList.add('active');
            input.focus();
        });
        input.addEventListener('blur', e => {
            e.stopPropagation();
            if (input.value === '') {
                searchButton.classList.remove('active');
            }
        });
        input.addEventListener('input', () => {
            const search = input.value.toLowerCase();
            this.content.forEach(item => {
                item.hidden = true;
                this.columns.forEach(column => {
                    if (item[column.id].toLowerCase().indexOf(search) !== -1) {
                        item.hidden = false;
                    }
                });
            });
            this.render();
        });
    }

    clear() {
        this.domElement.innerHTML = '';
        this.domElement.appendChild(this.head);
        this.content = [];
    }

    addItem(item) {
        this.content.push(item);
        this.render();
    }

    render() {
        this.domElement.querySelectorAll('.item').forEach(item => item.remove());

        this.content.forEach(item => {
            if (item.hidden) return;
            const itemDOM = document.createElement('div');
            itemDOM.classList.add('item');
            if (item.customClass) {
                itemDOM.classList.add(item.customClass);
            }
            itemDOM.innerHTML = this.columns.map(column => `<div class="column ${column.id || ''}">${item[column.id]}</div>`).join('');
    
            this.domElement.appendChild(itemDOM);
        });
    }

}