import i18next from 'i18next';

export default (req, res, next) => {
    res.templateRender = (view, templateVars = {}, namespaces = []) => {
        // an ordered namespace list to generate the template like thid
        // 'foo': res.locals.t('foo', { ns: 'translation' }),
        // 'bar': res.locals.t('bar', { ns: 'translation' }),
        const translations = {};
        for (let ns of namespaces) {
            let resources = i18next.getResourceBundle(req.language, ns);
            if (!resources) {
                const mainLang = req.language.split('-')[0]; // Extract the main language from dialect (e.g., 'en' from 'en-US')
                resources = i18next.getResourceBundle(mainLang, ns);
            }
            console.log(req.language, resources);
            // get every key in the namespace
            for (let key in resources) {
                translations[key] = res.locals.t(key, { ns });
            }
        }
        
        const template = {
            // pass the templateVars to a hidden input in the template. Frontend will read this and store it in a class
            'template-vars': JSON.stringify(templateVars),
            ...translations,
        };
        res.render(view, template);
        // console.log(template);
    }
    next();
};