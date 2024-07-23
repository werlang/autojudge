import TemplateVar from './template-var.js';
import Cookie from './cookies.js';

// bind the language switcher
document.querySelectorAll('footer #language a').forEach(e => e.addEventListener('click', () => {
    new Cookie('language').set(e.id, 365);
    location.reload();
}));

function translate(key) {
    const translations = TemplateVar.get('translations');
    if (!translations[key]) {
        console.log(`translation not found for key ${key}`);
        return key;
    }
    return translations[key];
}

export default translate;
