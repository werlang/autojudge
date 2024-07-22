import TypeIt from 'typeit';
import Card from './components/card.js';
import Modal from './components/modal.js';
import GoogleLogin from './helpers/google-login.js';
import Button from './components/button.js';
import TemplateVar from './helpers/template-var.js';
import Cookie from './helpers/cookies.js';

import '../less/index.less';

document.querySelector('footer #year').innerHTML = new Date().getFullYear();

// set up typewriter effect
document.querySelectorAll('section .col.text .content h1, #section-3 h1, #section-1 #welcome').forEach(e => {
    new TypeIt(e, {
        speed: 75,
        waitUntilVisible: true,
        cursorChar: '_',
    }).go();
});

const translations = TemplateVar.get('translations');
// console.log(translations);

// bind the language switcher
document.querySelectorAll('footer #language a').forEach(e => e.addEventListener('click', () => {
    new Cookie('language').set(e.id, 365);
    location.reload();
}));

const splashVideo = document.querySelector('#section-1 video');
splashVideo.playbackRate = 0.4;

GoogleLogin.init();
GoogleLogin.onFail(async () => {
    const modal = new Modal(`
        <h1>${translations['index-sign-up-h1']}</h1>
        <p>${translations['index-sign-up-p']}</p>
        <div id="button"></div>
    `, { id: 'signup' });
    GoogleLogin.renderButton(modal.get('#button'));
});

// bind buttons to google login
async function redirectOrLogin(path) {
    GoogleLogin.onSignIn(async () => location.href = `/${path}`);
    
    if (GoogleLogin.getCredential()) {
        location.href = `/${path}`;
        return;
    }
    return GoogleLogin.prompt(path);
}
new Button({ element: document.querySelector('#section-1 #join') }).click(async () => redirectOrLogin('dashboard'));
new Button({ element: document.querySelector('#section-4 #problems') }).click(async () => redirectOrLogin('problems'));
new Button({ element: document.querySelector('#section-5 #contests') }).click(async () => redirectOrLogin('contests'));
new Button({ element: document.querySelector('#section-6 #teams') }).click(async () => redirectOrLogin('teams'));

// add cards
const cardContainer = document.querySelector('#options');


new Card(cardContainer, {
    id: 'problems',
    icon: 'fa-solid fa-circle-question',
    title: translations['index-card-problems-title'],
    description: translations['index-card-problems-description'],
}).click(async () => {
    redirectOrLogin('problems');
});

new Card(cardContainer, {
    id: 'instructions',
    icon: 'fa-solid fa-medal',
    title: translations['index-card-contests-title'],
    description: translations['index-card-contests-description'],
}).click(async () => {
    redirectOrLogin('contests');
});

new Card(cardContainer, {
    id: 'judge',
    icon: 'fa-solid fa-people-group',
    title: translations['index-card-teams-title'],
    description: translations['index-card-teams-description'],
}).click(async () => {
    redirectOrLogin('teams');
});
