import i18next from 'i18next';

export default (req, res, next) => {
    res.templateRender = (view, templateVars = {}, namespaces = []) => {
        // an ordered namespace list to generate the template like thid
        // 'foo': res.locals.t('foo', { ns: 'translation' }),
        // 'bar': res.locals.t('bar', { ns: 'translation' }),
        const translations = {};
        for (let ns of namespaces) {
            // get the resources from the fallback language and the current language
            const fallbackResources = i18next.getResourceBundle(i18next.options.fallbackLng[0], ns);
            const currentResources = i18next.getResourceBundle(req.language, ns);
            // merge the resources so even if a key is missing in the current language, it will be present in the fallback language
            const resources = { ...fallbackResources, ...currentResources };

            // console.log(req.language, resources);
            // get every key in the namespace
            for (let key in resources) {
                translations[key] = res.locals.t(key, { ns });
            }
        }

        // add the translations to the templateVars
        templateVars.translations = translations;
        
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