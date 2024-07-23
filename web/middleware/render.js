export default (req, res, next) => {
    res.templateRender = async (view, templateVars = {}) => {
        // load view template
        let template;
        try {
            template = await import(import.meta.dirname + '/../template/' + view + '.js');
        }
        catch (e) {
            console.error(`Could not load template for ${view}`);
            template = { default: [] };
        }

        // get the translations for the view
        const translations = {};
        for (let item of template.default) {
            const viewKey = item[1].ns + '-' + item[0].replace('.', '-');
            translations[viewKey] = res.locals.t(...item);
        }
        // console.log(translations);
        
        const vars = {
            // pass the templateVars to a hidden input in the template. Frontend will read this and store it in a class
            'template-vars': JSON.stringify(templateVars),
            ...translations,
        };
        res.render(view, vars);
    }
    next();
};