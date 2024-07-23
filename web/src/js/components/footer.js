import TemplateVar from '../helpers/template-var.js';
import Cookie from '../helpers/cookies.js';

// bind the language switcher
document.querySelectorAll('footer #language a').forEach(e => e.addEventListener('click', () => {
    new Cookie('language').set(e.id, 365);
    location.reload();
}));

const translations = TemplateVar.get('translations');
// console.log(translations);

export { translations };
