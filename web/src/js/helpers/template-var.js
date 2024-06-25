export default class TemplateVar {

    static vars = {};
    static isBuilt = false;

    static build() {
        const e = document.querySelector('#template-vars');
        if (!e) return;

        try {
            const vars = JSON.parse(e.value);
            for (let i in vars) {
                TemplateVar.vars[i] = vars[i];
            }
        }
        catch (error) {
            console.error('Error parsing template variable:', error);
        }

        e.remove();
        TemplateVar.isBuilt = true;
    }

    static get(key) {
        if (!TemplateVar.isBuilt) {
            TemplateVar.build();
        }
        if (!key) {
            return TemplateVar.vars;
        }
        return TemplateVar.vars[key];
    }

}