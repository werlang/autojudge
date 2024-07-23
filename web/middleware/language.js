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
    const filePath = path.join(import.meta.dirname, '..', 'public/locales', lng, `${ns}.json`);
    if (fs.existsSync(filePath)) {
        const file = JSON.parse(fs.readFileSync(filePath));
        return {[lng]: { [ns]: file }};
    }
    console.error(`Could not load translation file for ${lng} at ${filePath}`);
    return {[lng]: { [ns]: {} }};
};

export default {
    init: async function({languages, namespaces}) {
        i18next.init({
            fallbackLng: 'en',
            resources: await loadLocales(languages, namespaces),
            // debug: true,
        });
    },

    listen: function() {
        return async (req, res, next) => {
            // check if there are language cookies
            if (req.cookies.language) {
                req.language = req.cookies.language;
            }
            else {
                const header = req.headers['accept-language'];
                const language = header ? header.split(',')[0].split('-')[0] : 'en';
                req.language = language;
            }
            
            i18next.changeLanguage(req.language);
            res.locals.t = i18next.t.bind(i18next);
            next();
        }
    },
}