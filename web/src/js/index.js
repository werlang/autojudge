import TypeIt from 'typeit';
import Card from './components/card.js';
import Modal from './components/modal.js';
import GoogleLogin from './helpers/google-login.js';
import Button from './components/button.js';
import Translator from './helpers/translate.js';
import Toast from './components/toast.js';
import LocalData from './helpers/local-data.js';
import Form from './components/form.js';

import '../less/index.less';

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

const translate = await new Translator(['en', 'pt'], ['index', 'components']).init();


GoogleLogin.init({ redirectUri: `https://${window.location.hostname}/dashboard` });
GoogleLogin.onFail(showSignInModal);

let redirectMessage = new LocalData({ id: 'redirect-message' });
let credential = GoogleLogin.getCredential();
// console.log(credential);
// check if the credential is expired and show a message
if (redirectMessage.get() === 'expired') {
    // GoogleLogin.removeCredential();
    new Toast(translate('login.expired', 'index'), { type: 'error' });
    redirectMessage.remove();
    credential = null;
}

// bind buttons to google login
async function redirectOrLogin(path) {
    GoogleLogin.onSignIn(async () => {
        redirectMessage.remove();
        location.href = `/${path}`;
    });
    
    if (credential) {
        location.href = `/${path}`;
        return;
    }
    try {
        if (redirectMessage.get() === 'logout') {
            showSignInModal();
            return;
        }
        return await GoogleLogin.prompt(path);
    }
    catch (error) {
        console.error(error);
        new Toast(error.message, { type: 'error' });
    }
}
new Button({ element: document.querySelector('#section-1 #manage') }).click(async () => redirectOrLogin('dashboard'));
new Button({ element: document.querySelector('#section-1 #compete') }).click(async () => location.href = '/teams');
new Button({ element: document.querySelector('#section-4 #problems') }).click(async () => redirectOrLogin('problems'));
new Button({ element: document.querySelector('#section-5 #contests') }).click(async () => redirectOrLogin('contests'));
new Button({ element: document.querySelector('#section-6 #teams') }).click(async () => location.href = '/teams');

function showSignInModal() {
    const modal = new Modal(`
        <form>
            <h1>${translate('signin.h1', 'index')}</h1>
            <input id="email" type="email" name="email" placeholder="${translate('signin.email', 'index')}" required>
            <input id="password" type="password" name="password" placeholder="${translate('signin.password', 'index')}" required>
            <div id="button-container">
                <button id="button" type="submit" class="default">${translate('signin.button', 'index')}</button>
                <div id="google-signin"></div>
            </div>
            <div id="signup-container">
                <span>${translate('signin.no-account', 'index')}<a href="/signup">${translate('signin.signup', 'index')}</a></span>
            </div>
        </form>
    `, { id: 'signin' });
    
    new Form(modal.get('form')).submit(async data => {
        console.log(data);
    });

    GoogleLogin.renderButton(modal.get('#google-signin'));
}

// add cards
const cardContainer = document.querySelector('#options');


new Card(cardContainer, {
    id: 'problems',
    icon: 'fa-solid fa-circle-question',
    title: translate('card.problems.title', 'index'),
    description: translate('card.problems.description', 'index'),
}).click(async () => {
    redirectOrLogin('problems');
});

new Card(cardContainer, {
    id: 'instructions',
    icon: 'fa-solid fa-medal',
    title: translate('card.contests.title', 'index'),
    description: translate('card.contests.description', 'index'),
}).click(async () => {
    redirectOrLogin('contests');
});

new Card(cardContainer, {
    id: 'judge',
    icon: 'fa-solid fa-people-group',
    title: translate('card.teams.title', 'index'),
    description: translate('card.teams.description', 'index'),
}).click(async () => {
    location.href = '/teams';
});
