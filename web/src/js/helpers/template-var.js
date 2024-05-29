export default class TemplateVar {

    static vars = {};
    static isBuilt = false;

    static build() {
        document.querySelectorAll('.template-var').forEach(e => {
            TemplateVar.vars[e.id] = e.value;
            e.remove();
        });
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