// Table class: a table with sortable columns and search functionality
// const table = new Table({
//   element: DOMElement,
//   id: 'table-id',
//   columns: [{ id: 'column1', name: 'Column 1', size: 'small' }, ...],
//   controls: [control1, control2, ...],
//   translate: function,
// });
// columns: an array of objects with the following properties:
//   - id: the id of the column (required)
//   - name: the name of the column (required)
//   - size: 'small' for small columns
// controls: an array of objects with the following properties:
//   - id: the id of the control (required)
//   - icon: the icon representing the control
//   - title: the title for when hovering over the control
//   - action: the callback function for when the control is clicked
//     - it receives the selected items and the event
//   - enabled: whether the control is enabled or not


// Methods:
//   - clear(): clears the table content
//   - addItem(item): adds an item (row) to the table
//   - addItemEvent(event, action): adds an event to the items
//     - event: the event to listen for
//     - action: the callback function. It receives the item and the event
//   - getSelected(): returns the selected items
//   - enableControl(id): enables a control
//   - disableControl(id): disables a control


import Translator from "../helpers/translate.js";


export default class Table {

    placeholderAmount = 10;
    content = [];

    constructor({ element, id, columns, controls, translate, selection, search, sort }) {
        this.columns = columns;
        this.controls = controls || [];
        this.translate = translate;
        this.sort = sort !== false;
        this.search = search !== false;
        this.domElement = document.createElement('div');
        if (id) this.domElement.id = id;
        
        this.selection = selection || { enabled: false, multi: false };
        if (this.selection === true || this.selection === false) {
            this.selection = { enabled: this.selection, multi: false };
        }
        this.selectedItems = [];

        this.domElement.classList.add('table');
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
            if (column.size === 'small') {
                columnDOM.classList.add('small');
            }
            columnDOM.innerHTML = `${column.name}${this.sort ? '<div class="button"><i class="fa-solid fa-arrow-down-a-z"></i></div>' : ''}`;

            if (this.sort) {
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
                        this.content.sort((a, b) => a[column.id].localeCompare(b[column.id], Translator.currentLanguage(), { sensitivity: 'base' }));
                    }
                    else {
                        button.sort = 'asc';
                        this.content.sort((a, b) => b[column.id].localeCompare(a[column.id], Translator.currentLanguage(), { sensitivity: 'base' }));
                    }
    
                    this.render();
                });
            }

            return columnDOM;
        });

        this.head = document.createElement('div');
        this.head.classList.add('head');
        this.head.innerHTML = `
            <div class="columns"></div>
            <div class="controls">
                ${this.search ? `<div class="search button" title="${this.translate('table.search-title', 'components')}"><i class="fas fa-search"></i><input type="text"></div>` : ''}
            </div>
        `;

        // add custom controls
        const controlsDOM = this.head.querySelector('.controls');
        this.controls.forEach(control => {
            control.enabled = control.enabled || true;
            const controlDOM = document.createElement('div');
            controlDOM.classList.add('button', control.id);
            if (!control.enabled) {
                controlDOM.classList.add('disabled');
            }
            controlDOM.innerHTML = `<i class="${control.icon}"></i>`;
            controlDOM.addEventListener('click', ev => {
                if (!control.enabled) return;
                return control.action(this.selectedItems, ev);
            });
            controlDOM.title = control.title;
            controlsDOM.appendChild(controlDOM);
        });

        this.head.querySelector('.columns').append(...columns);

        // create the search function
        if (this.search) {
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

            // create selection events
            if (this.selection.enabled) {
                itemDOM.addEventListener('click', () => {
                    if (this.selectedItems.includes(item)) {
                        this.selectedItems = this.selectedItems.filter(i => i !== item);
                    }
                    else {
                        if (!this.selection.multi) {
                            this.selectedItems = [];
                        }
                        this.selectedItems.push(item);
                    }
                    this.render();
                    // console.log(this.selectedItems);
                    
                });
            }
            if (this.selectedItems.includes(item)) {
                itemDOM.classList.add('selected');
            }

            if (item.customClass) {
                itemDOM.classList.add(item.customClass);
            }
            itemDOM.innerHTML = this.columns.map(column => {
                let classes = ['column'];
                if (column.size === 'small') {
                    classes.push('small');
                }
                if (column.id) {
                    classes.push(column.id);
                }
                return `<div class="${classes.join(' ')}">${item[column.id]}</div>`
            }).join('');
    
            if (this.itemEvents) {
                this.itemEvents.forEach(event => {
                    itemDOM.addEventListener(event.event, ev => {
                        event.action(item, ev);
                    });
                });
            }

            this.domElement.appendChild(itemDOM);
        });
    }

    addItemEvent(event, action) {
        if (!this.itemEvents) {
            this.itemEvents = [];
        }
        this.itemEvents.push({ event, action });
        this.render();
    }

    getSelected() {
        return this.selectedItems;
    }

    enableControl(...ids) {
        ids.forEach(id => {
            const control = this.head.querySelector(`.controls .${id}`);
            if (!control) return;
            control.classList.remove('disabled');

            const controlObj = this.controls.find(c => c.id === id);
            if (controlObj) {
                controlObj.enabled = true;
            }
        });
    }

    disableControl(...ids) {
        ids.forEach(id => {
            const control = this.head.querySelector(`.controls .${id}`);
            if (!control) return;
            control.classList.add('disabled');

            const controlObj = this.controls.find(c => c.id === id);
            if (controlObj) {
                controlObj.enabled = false;
            }
        });
    }

}