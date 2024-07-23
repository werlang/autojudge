import TypeIt from 'typeit';
import Card from './components/card.js';
import Modal from './components/modal.js';
import GoogleLogin from './helpers/google-login.js';
import Button from './components/button.js';
import translate from './helpers/translate.js';

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

const splashVideo = document.querySelector('#section-1 video');
splashVideo.playbackRate = 0.4;

GoogleLogin.init();
GoogleLogin.onFail(async () => {
    const modal = new Modal(`
        <h1>${translate('index-sign-up-h1')}</h1>
        <p>${translate('index-sign-up-p')}</p>
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
    title: translate('index-card-problems-title'),
    description: translate('index-card-problems-description'),
}).click(async () => {
    redirectOrLogin('problems');
});

new Card(cardContainer, {
    id: 'instructions',
    icon: 'fa-solid fa-medal',
    title: translate('index-card-contests-title'),
    description: translate('index-card-contests-description'),
}).click(async () => {
    redirectOrLogin('contests');
});

new Card(cardContainer, {
    id: 'judge',
    icon: 'fa-solid fa-people-group',
    title: translate('index-card-teams-title'),
    description: translate('index-card-teams-description'),
}).click(async () => {
    redirectOrLogin('teams');
});
