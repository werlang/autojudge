// Load HTML file and replace variables, using cache to avoid multiple fetches.
// USAGE: 
//   const html = HTMLLoader('file-name', { var1: 'value1', var2: 'value2' });
//   html.load(element);
//   html.setVars({ var1: 'new-value1', var2: 'new-value2' }).load(element);

//   HTMLLoader('file-name', { var1: 'value1', var2: 'value2' }, element).load();
// Methods:
//   fetch(ignoreCache): load HTML file. If ignoreCache is true, fetch load the file again from server
//   load(target): load HTML file and set it to target element. If target is not provided, load to this.target
//   setVars(vars): set variables to be replaced by a following call to load

export default class HTMLLoader {

    html = null;

    constructor(file, vars, target) {
        this.file = file;
        this.vars = vars || {};
        this.target = target;
    }

    setVars(vars) {
        this.vars = vars;
        return this;
    }

    // retrieve the HTML file from cache or server
    async fetch(ignoreCache = false) {
        if (!this.file) {
            throw new Error('No file provided');
        }

        let useCache = this.html && !ignoreCache;

        if (useCache) {
            return this.html;
        }
        
        try {
            this.html = await fetch(`html/${ this.file }.html`).then(res => res.text());
            return this.html;
        }
        catch (error) {
            this.html = null;
            throw error;
        }
    }

    async load(target, ignoreCache = false) {
        await this.fetch(ignoreCache);

        target = target || this.target;

        let replaced = this.html;
        Object.entries(this.vars).forEach(([k,v]) => {
            const regex = new RegExp(`{{${k}}}`, 'g');
            replaced = replaced.replace(regex, v);
        });

        if (target) {
            target.innerHTML = replaced;
        }

        return this;
    }

}
