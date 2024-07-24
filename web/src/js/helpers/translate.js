import Cookie from './cookies.js';
import i18next from 'i18next';

// bind the language switcher
document.querySelectorAll('footer #language a').forEach(e => e.addEventListener('click', () => {
    new Cookie('language').set(e.id, 365);
    location.reload();
}));


class Translator {

    static cache = {};
    static loaded = false;

    constructor(languages, namespaces) {
        this.languages = languages;
        this.namespaces = namespaces;
    }
    
    async init() {
        if (!Translator.loaded) {
            i18next.init({
                fallbackLng: 'en',
                resources: await this.loadLocales(),
                // debug: true,
            });
            i18next.changeLanguage(this.getLanguage());
            Translator.loaded = true;
        }
        return (key, ns, modifiers) => this.translate(key, ns, modifiers);
    }

    getLanguage() {
        return new Cookie('language').get() || navigator.language.split('-')[0];
    }

    translate(key, ns, modifiers = {}) {
        return i18next.t(key, { ns, ...modifiers });
    }

    async loadLocales() {
        const languageList = {};
        const promises = [];
        
        for (let lng of this.languages) {
            languageList[lng] = {};
            for (let ns of this.namespaces) {
                // languageList[lng][ns] = this.loadLocale(lng, ns);
                const promise = this.loadLocale(lng, ns);
                promise.then(file => languageList[lng][ns] = file);
                promises.push(promise);
            }
        }

        // await all promises
        await Promise.all(promises);

        // console.log(languageList);
        return languageList;
    }

    async loadLocale(lng, ns) {
        if (Translator.cache[`${lng}-${ns}`]) {
            return Translator.cache[`${lng}-${ns}`];
        }
        const filePath = `/locales/${lng}/${ns}.json`;
        const file = await fetch(filePath).then(res => res.json());
        Translator.cache[`${lng}-${ns}`] = file;
        return file;
    }

}

export default Translator;
