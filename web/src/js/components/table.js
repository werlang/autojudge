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

    constructor({ element, id, columns, controls, translate, selection, search, sort, maxItems, pagination }) {
        this.columns = columns;
        this.controls = controls || [];
        this.translate = translate;
        this.sort = sort === false ? false : sort || true;
        this.search = search !== false;
        this.maxItems = maxItems || Infinity;
        this.pagination = pagination || false;
        this.domElement = document.createElement('div');
        if (id) this.domElement.id = id;
        
        this.selection = selection || { enabled: false, multi: false };
        if (this.selection === true || this.selection === false) {
            this.selection = { enabled: this.selection, multi: false };
        }
        this.selectedItems = [];

        this.pages = {
            current: 1,
            total: 1,
            itemIndex: 0,
        };

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

            const orderIcon = column.sort === 'asc' ? 'fa-arrow-up-a-z' : 'fa-arrow-down-a-z';

            columnDOM.innerHTML = `${column.name}${this.sort && column.sort !== false ? `<div class="button"><i class="fa-solid ${orderIcon}"></i></div>` : ''}`;
            
            if (this.sort && column.sort !== false) {
                const button = columnDOM.querySelector('.button');
                
                // click the sort button
                button.addEventListener('click', () => {
                    // console.log('sort by', column.id, button.sort);
                    button.querySelector('i').classList.toggle('fa-arrow-down-a-z');
                    button.querySelector('i').classList.toggle('fa-arrow-up-a-z');
                    
                    // make active only the clicked button
                    columns.forEach(c => {
                        if (!c.querySelector('.button')) return;
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
            const removeAccents = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            input.addEventListener('input', () => {
                const search = input.value.toLowerCase();
                this.content.forEach(item => {
                    item.hidden = true;
                    this.columns.forEach(column => {
                        if (removeAccents(item[column.id].toLowerCase()).includes(removeAccents(search))) {
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

        const availableItems = this.content.filter(item => !item.hidden);

        this.pages.total = Math.ceil(availableItems.length / this.maxItems);
        this.pages.current = Math.ceil((this.pages.itemIndex + 1) / this.maxItems);

        for (let i = this.pages.itemIndex ; i < this.pages.itemIndex + this.maxItems ; i++) {
            const item = availableItems[i];
            if (!item) break;
            if (item.hidden) continue;
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
                return `<div class="${classes.join(' ')}">${item[column.id]}</div>`;
            }).join('');
    
            if (this.itemEvents) {
                this.itemEvents.forEach(event => {
                    itemDOM.addEventListener(event.event, ev => {
                        event.action(item, ev);
                    });
                });
            }

            this.domElement.appendChild(itemDOM);
        }

        if (this.pagination) this.showPagination();
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

    srt(column, order) {
        // console.log('sort', column, order);

        const columnDOM = this.head.querySelector(`.${column}`);
        this.head.querySelectorAll(`.${column} .button i`).forEach(icon => icon.classList.remove('active'));
        const button = columnDOM.querySelector('.button');
        let sortIcon;
        if (button) {
            sortIcon = button.querySelector('i');
        }

        if (order === 'asc') {
            this.content.sort((a, b) => {
                if (!isNaN(a[column]) && !isNaN(b[column])) {
                    return parseFloat(a[column]) - parseFloat(b[column]);
                }
                return a[column].localeCompare(b[column], Translator.currentLanguage(), { sensitivity: 'base' })
            });
            if (button) {
                button.sort = 'desc';
                sortIcon.classList.add('fa-arrow-down-a-z', 'active');
                sortIcon.classList.remove('fa-arrow-up-a-z');
            }
        }
        else {
            this.content.sort((a, b) => {
                if (!isNaN(a[column]) && !isNaN(b[column])) {
                    return parseFloat(b[column]) - parseFloat(a[column]);
                }
                return b[column].localeCompare(a[column], Translator.currentLanguage(), { sensitivity: 'base' })
            });
            if (button) {
                button.sort = 'asc';
                sortIcon.classList.add('fa-arrow-up-a-z', 'active');
                sortIcon.classList.remove('fa-arrow-down-a-z');
            }
        }
        this.render();
    }

    showPagination() {
        const itemDOM = document.createElement('div');
        itemDOM.classList.add('item', 'pagination');
        itemDOM.innerHTML = `
            <div class="button"><i class="fas fa-angles-left"></i></div>
            <div class="button"><i class="fas fa-angle-left"></i></div>
            <div class="pages">
                <span class="active">${this.pages.current}</span>
                /
                <span class="total">${this.pages.total}</span>
            </div>
            <div class="button"><i class="fas fa-angle-right"></i></div>
            <div class="button"><i class="fas fa-angles-right"></i></div>
        `;

        const [firstButtons, prevButton, nextButton, lastButton] = Array.from(itemDOM.querySelectorAll('.button'));
        [firstButtons, prevButton, nextButton, lastButton].forEach(button => button.classList.add('disabled'));

        if (this.pages.current > 1) {
            firstButtons.classList.remove('disabled');
            prevButton.classList.remove('disabled');
        }
        if (this.pages.current < this.pages.total) {
            nextButton.classList.remove('disabled');
            lastButton.classList.remove('disabled');
        }

        firstButtons.addEventListener('click', () => {
            if (firstButtons.classList.contains('disabled')) return;
            this.pages.itemIndex = 0;
            this.render();
        });

        prevButton.addEventListener('click', () => {
            if (prevButton.classList.contains('disabled')) return;
            if (this.pages.current > 1) {
                this.pages.itemIndex -= this.maxItems;
            }
            this.render();
        });

        nextButton.addEventListener('click', () => {
            if (nextButton.classList.contains('disabled')) return;
            if (this.pages.current < this.pages.total) {
                this.pages.itemIndex += this.maxItems;
            }
            this.render();
        });

        lastButton.addEventListener('click', () => {
            if (lastButton.classList.contains('disabled')) return;
            this.pages.itemIndex = this.maxItems * (this.pages.total - 1);
            this.render();
        });

        this.domElement.appendChild(itemDOM);
    }
}