// Select class: a select in a form
// const select = new Select(DOMElement);
// Methods:
//   - get(): get the DOM element
//   - addOption(value, text, options): add an option to the select
//   - addOptions(options): add multiple options to the select
//   - change(callback): add a change event to the select
//   - build(): create a custom select options list


export default class Select {
    constructor(element, { search=false }={}) {
        this.element = element;
        this.value = this.element.value || '';
        this.search = search;

        this.build();
    }

    // create a custom select with div
    build() {
        const wrapper = document.createElement('div');
        wrapper.classList.add('material-input');
        this.element.replaceWith(wrapper);
        
        wrapper.appendChild(this.element);

        // add click event to the select
        this.element.addEventListener('mousedown', e => {
            e.preventDefault();

            this.element.classList.add('open');

            // prevent creating multiple option lists
            if (wrapper.querySelector('.options')) return;
            
            // create custom option list
            const options = this.element.querySelectorAll('option');
            this.optionList = document.createElement('div');

            // add search input if search is enabled
            if (this.search) {
                wrapper.appendChild(this.addSearchInput());
            }

            // add the custom option list to the select
            wrapper.appendChild(this.optionList);

            this.optionList.style['width'] = this.element.offsetWidth + 'px';
            
            this.optionList.classList.add('options');
            // add a delay make sure the animation is played
            setTimeout(() => this.optionList.classList.add('active'), 1);
            
            // get Y position of the select element
            const selectY = this.element.getBoundingClientRect().top;
            // set optionList Y position to be below the select element
            this.optionList.style['top'] = selectY + 'px';
            
            // make search input to be on top of the select element
            if (this.search) {
                this.searchInput.style['top'] = selectY + 'px';
            }

            // set the max height so the list doesn't overflow the screen
            let maxHeight = (window.innerHeight - this.optionList.getBoundingClientRect().top - 10);

            // prevent the list from being too small. Place the list above the select element
            if (maxHeight < 150) {
                maxHeight = 350;
                this.optionList.style['top'] = (selectY - maxHeight) + 'px';
                this.optionList.classList.add('above');
            }

            this.optionList.style['max-height'] = maxHeight + 'px';
            

            // add each option to the custom option list
            options.forEach(option => {
                const item = document.createElement('div');
                item.classList.add('option');
                item.innerHTML = option.innerHTML;
                item.dataset.value = option.value;

                if (option.disabled) item.classList.add('disabled');

                this.optionList.appendChild(item);
            });

            // add click event to each option
            this.optionList.querySelectorAll('.option').forEach(option => {
                option.addEventListener('click', () => {
                    // prvent clicking the disabled options
                    if (option.classList.contains('disabled')) return;

                    // set the value of the select
                    this.set(option.dataset.value);

                    // close the custom select
                    this.close();
                });
            });

            // close the custom select when clicking outside
            document.addEventListener('mousedown', e => {
                if (!wrapper.contains(e.target)) {
                    this.close();
                }
            });

        });
        
    }

    get() {
        return this.element;
    }

    set(value) {
        this.element.value = value;
        this.value = value;
        this.element.dispatchEvent(new Event('change'));
        this.element.classList.add('selected');
    }

    addOption(value, text, options = {}) {
        const option = document.createElement('option');
        option.value = value;
        option.innerHTML = text;
        for (let i in options) {
            option.setAttribute(i, options[i]);
        }
        this.get().appendChild(option);
    }

    addOptions(options) {
        this.get().innerHTML = '';
        options.forEach(option => this.addOption(option.value, option.text, option.options));
    }

    change(callback) {
        this.get().addEventListener('change', callback);
    }

    setError(message) {
        this.element.classList.add('error');
        this.element.focus();
    }
    
    clearError() {
        this.element.classList.remove('error');
        return;    
    }

    close() {
        this.element.classList.remove('open');
        this.optionList.remove();

        if (this.search) {
            this.searchInput.remove();
        }
    }

    allowSearch(value) {
        this.search = value;
    }

    addSearchInput() {
        // this will make select element invisible when open
        this.element.classList.add('searchable');

        // create search input
        this.searchInput = document.createElement('input');
        this.searchInput.classList.add('search');
        this.searchInput.setAttribute('placeholder', 'Pesquisar...');
        this.searchInput.style['width'] = this.element.offsetWidth + 'px';
        
        // add keyup event to the search input
        this.searchInput.addEventListener('keyup', e => {
            const value = e.target.value.toLowerCase();
            this.searchInput.parentNode.querySelectorAll('.option').forEach(option => {
                if (option.innerHTML.toLowerCase().indexOf(value) == -1) {
                    option.classList.add('hidden');
                } else {
                    option.classList.remove('hidden');
                }
            });
        });

        // focus the search input after the animation is played and the select is open
        setTimeout(() => this.searchInput.focus(), 10);

        return this.searchInput;
    }

}