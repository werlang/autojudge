export default class ModuleLoader {
    module = null;

    constructor(fixedObjects = {}, buildFunction = 'build') {
        this.fixedObjects = fixedObjects;
        this.buildFunction = buildFunction;
    }

    async load(name, objects = {}) {
        objects = { ...this.fixedObjects, ...objects };

        if (this.module) return this;

        const module = await import('../'+ name);
        this.module = module.default;

        for (const key in objects) {
            this.module[key] = objects[key];
        }

        this.module[this.buildFunction](objects);
        return this;
    }
}