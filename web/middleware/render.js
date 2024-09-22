export default fixedVars => (req, res, next) => {
    res.templateRender = async (view, templateVars = {}) => {
        // set fixed variables
        templateVars = {
            ...fixedVars,
            ...templateVars,
        };

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

        // eliminate undefined values
        for (let key in templateVars) {
            if (!templateVars[key]) {
                delete templateVars[key];
            }
        }

        const vars = {
            // send the templateVars to a hidden input in the template. Frontend will read this and store it in a class
            'template-vars': `<input id="template-vars" type="hidden" value="${new URLSearchParams(templateVars).toString()}">`,
            // send the templateVars to replace the view
            ...templateVars,
            // send the translations to the view
            ...translations,
        };
        res.render(view, vars);
    }
    next();
};