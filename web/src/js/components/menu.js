// Menu class
// Create a menu with the given items
// Parameters:
//   - items: array of objects with the following properties:
//     - id: string with the id of the menu item
//     - icon: string with the icon class of the menu item (from fontawesome)
//     - text: string with the text of the menu item
//     - action: function to be executed when the menu item is clicked
//   - domElement: DOM element to build the menu
// Methods:
//   - build(): build the menu
//   - addAction(id, action): add an action to a menu item
//     - id: string with the id of the menu item to add the action
//     - action: callback function to be executed when the menu item is clicked
//   - click(id): click a menu item
//   - getActive(): return the active menu item
//   - changeAlertIcon(itemId, value): change the alert icon of a menu item


export default class Menu {
    
    active = false;
    loading = false;
    action = {};

    constructor({ items, domElement }) {
        this.items = items;
        this.domElement = domElement;

        this.build();
    }

    build() {
        if (!this.domElement) {
            this.domElement = document.createElement('div');
            this.domElement.id = 'menu';
        }

        // create menu items as HTML string
        const itemsHTML = this.items.map((item,index) => {
            if (item.default) {
                this.active = index;
            }

            let subitemsHTML = '';
            if (item.subitems) {
                subitemsHTML = item.subitems.map(subitem => {
                    return `<div class="menu-item" id="${ subitem.id }">
                        <div class="icon"><i class="${ subitem.icon }"></i></div>
                        <div class="text">${ subitem.text }</div>
                    </div>`
                }).join('');
            }

            return `
                <div class="menu-item ${ item.default ? 'active' : '' } ${ subitemsHTML ? 'parent' : '' }" id="${ item.id }">
                    <div class="icon"><i class="${ item.icon }"></i></div>
                    <div class="text">${ item.text }</div>
                </div>
                ${ subitemsHTML ? `<div class="subitems">${ subitemsHTML }</div>` : '' }
            `;
        }).join('');

        // build menu
        this.domElement.innerHTML = `
            <div id="top">
                <div id="logo">
                    <a href="/"></a>
                </div>
                <div id="user">
                    <a href="/perfil">
                        <div id="user-avatar"><img alt="Avatar"></div>
                        <div id="user-name"></div>
                    </a>
                </div>
            </div>
            <div id="menu-item-container">${ itemsHTML }</div>
        `;

        // set active menu item when clicked
        this.domElement.querySelectorAll('.menu-item').forEach((e,i) => e.addEventListener('click', async ev => {    
            if (this.loading) return;
            this.loading = true;      
            this.domElement.querySelectorAll('.menu-item').forEach(e => e.classList.remove('active'));
            e.classList.add('active');
            // activate the parent
            if (e.closest('.subitems')) {
                e.closest('.subitems').previousElementSibling.classList.add('active');
            }

            // execute action if it has one and it's not the active menu item (to avoid double click)
            if (this.action[e.id] && i !== this.active) {
                // set here so the action also knows the active menu item
                this.active = i;
                await this.action[e.id](ev);
            }
            this.active = i;
            this.loading = false;
        }));

        // set action for each menu item, if it has one
        this.items.forEach(item => {
            if (item.action) {
                this.addAction(item.id, item.action);
            }

            if (item.subitems) {
                item.subitems.forEach(subitem => {
                    if (subitem.action) {
                        this.addAction(subitem.id, subitem.action);
                    }
                });
            }

            // execute action if it's the default menu item
            if (item.default && item.action) {
                this.action[item.id]();
            }
        });
    }

    // add action to menu item
    addAction(id, action) {
        this.action[id] = action;
    }

    click(id) {
        this.domElement.querySelector(`#${ id }`).click();
    }

    getActive() {
        // flatten items and subitems
        const items = this.items.reduce((acc, item) => item.subitems ? acc.concat(item, item.subitems) : acc.concat(item), []);
        
        return items[this.active] || false;
    }

    changeAlertIcon(itemId, value) {
        const item = this.items.find(item => item.id === itemId);
        if (!item) return;

        const icon = this.domElement.querySelector(`#${ itemId } .icon i`);
        if (value) {
            icon.classList.add('alert', 'fa-exclamation-circle');
            icon.classList.remove(item.icon.split(' ')[1]);
            if (item.floatingAction) {
                item.floatingAction.show();
            }
        }
        else {
            icon.classList.remove('alert', 'fa-exclamation-circle');
            icon.classList.add(item.icon.split(' ')[1]);
            if (item.floatingAction) {
                item.floatingAction.hide();
            }
        }
    }

}