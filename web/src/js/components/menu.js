// Menu class
// Create a menu with the given items
// Parameters:
//   - items: array of objects with the following properties:
//     - id: string with the id of the menu item
//     - icon: string with the icon class of the menu item (from fontawesome)
//     - text: string with the text of the menu item
//     - action: function to be executed when the menu item is clicked
//   - domElement: DOM element to build the menu. If not provided, a new element will be created with a fog
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
    width = 300;

    constructor({ items, domElement, width, usePath }) {
        this.items = items;
        this.domElement = domElement;
        this.width = width || this.width;
        this.usePath = usePath || false;

        this.build();
    }

    build() {
        if (!this.domElement) {
            this.domElement = document.createElement('div');
            this.domElement.id = 'menu';

            // wrap ip in fog
            const fog = document.createElement('div');
            fog.id = 'fog';
            fog.appendChild(this.domElement);
            document.body.appendChild(fog);

            fog.addEventListener('click', () => this.close());
            this.domElement.addEventListener('click', ev => ev.stopPropagation());
            this.close(0);
        }

        // create menu items as HTML string
        const itemsHTML = this.items.map((item,index) => {
            if (item.default) {
                this.active = index;
            }
            // check for pathname
            if (this.usePath && location.pathname.slice(1) === item.id) {
                this.active = index;
                item.default = true;
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
                    <a href="/">
                        <img src="img/autojudge.webp" alt="AutoJudge">
                        <span>AutoJudge</span>
                    </a>
                </div>
            </div>
            <div id="menu-item-container">${ itemsHTML }</div>
        `;
        this.domElement.style.setProperty('--width', `${ this.width }px`);

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
                this.close();
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
        return this;
    }

    click(id) {
        this.domElement.querySelector(`#${ id }`).click();
        return this;
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

    // close the menu without removing it
    close(time) {
        const hideTime = time || 300;
        const fog = this.domElement.closest('#fog');
        fog.classList.add('hidden', 'playing');
        fog.style.setProperty('--hide-time', `${hideTime}ms`);
        setTimeout(() => fog.classList.remove('playing'), hideTime + 500);
    }

    open() {
        const fog = this.domElement.closest('#fog');
        fog.classList.remove('hidden');
        fog.classList.add('playing');
        setTimeout(() => fog.classList.remove('playing'), 1);
    }

}
