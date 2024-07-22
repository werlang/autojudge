import i18next from 'i18next';
import path from 'path';
import fs from 'fs';

// Function to load translation files
const loadLocales = async (languages, namespaces) => {
    const languageList = {};
    for (let lng of languages) {
        languageList[lng] = namespaces;
    }

    const translations = {};
    for (let lng in languageList) {
        const namespaces = languageList[lng];
        for (let ns of namespaces) {
            const translation = await loadLocale(lng, ns);
            translations[lng] = { ...translations[lng], ...translation[lng] };
        }
    }
    // console.log(translations);
    return translations;
};

// Function to load a single translation file
const loadLocale = async (lng, ns) => {
    const filePath = path.join(import.meta.dirname, '..', 'locales', lng, `${ns}.js`);
    if (fs.existsSync(filePath)) {
        const module = await import(filePath);
        return {[lng]: { [ns]: module.default }};
    }
    console.error(`Could not load translation file for ${lng} at ${filePath}`);
    return {[lng]: { [ns]: {} }};
};

i18next.init({
    fallbackLng: 'en',
    resources: await loadLocales(
        ['en', 'pt'],
        ['index']
    ),
    // debug: true,
});

export default (req, res, next) => {
    const header = req.headers['accept-language'];
    const language = header ? header.split(',')[0] : 'en';
    req.language = language;
    i18next.changeLanguage(language);
    res.locals.t = i18next.t.bind(i18next);
    next();
}