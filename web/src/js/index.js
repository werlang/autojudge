import TypeIt from 'typeit';
import Card from './components/card.js';
import Modal from './components/modal.js';
import GoogleLogin from './helpers/google-login.js';
import Button from './components/button.js';
import Translator from './helpers/translate.js';
import Toast from './components/toast.js';
import LocalData from './helpers/local-data.js';
import Form from './components/form.js';
import User from './model/user.js';
import TemplateVar from './helpers/template-var.js';

import '../less/index.less';

// set up typewriter effect
document.querySelectorAll('section .col.text .content h2, #section-3 h2, #section-1 #welcome').forEach(e => {
    new TypeIt(e, {
        speed: 75,
        waitUntilVisible: true,
        cursorChar: '_',
    }).go();
});

const splashVideo = document.querySelector('#section-1 video');
splashVideo.playbackRate = 0.4;

const translate = await new Translator(['en', 'pt'], [
    'index',
    'components',
    'api',
]).init();

if (!TemplateVar.get('localServer')) {
    GoogleLogin.init({ redirectUri: `https://${window.location.hostname}/dashboard` });
    GoogleLogin.onFail(showSignInModal);
}

let redirectMessage = new LocalData({ id: 'redirect-message' });
let googleCredential = GoogleLogin.getCredential();
let userToken = User.getToken();
// console.log(credential);
// check if the credential is expired and show a message
if (redirectMessage.get() === 'expired') {
    // GoogleLogin.removeCredential();
    new Toast(translate('login.expired', 'index'), { type: 'error' });
    redirectMessage.remove();
    googleCredential = null;
    userToken = null;
    GoogleLogin.removeCredential();
    User.removeToken();
}

// bind buttons to google login
async function redirectOrLogin(path) {
    if (TemplateVar.get('localServer')) {
        showSignInModal();
        return;
    }

    GoogleLogin.onSignIn(async () => {
        redirectMessage.remove();
        location.href = `/${path}`;
    });
    
    if (googleCredential || userToken) {
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


let formSignin = null;
let formSignup = null;

function showSignInModal() {
    let modal = null;

    if (!formSignin) {
        formSignin = new Form((() => {
            const form = document.createElement('form');
            form.id = 'signin';
            form.innerHTML = `
                <h1>${translate('signin.h1', 'index')}</h1>
                <input id="email" type="email" name="email" placeholder="${translate('signin.email', 'index')}" required>
                <input id="password" type="password" name="password" placeholder="${translate('signin.password', 'index')}" required>
                <div id="button-container">
                    <button id="button" type="submit" class="default">${translate('signin.button', 'index')}</button>
                    <div id="google-signin"></div>
                </div>
                <div id="signup-container" class="bottom-link">
                    <span>${translate('signin.no-account', 'index')}<a>${translate('signin.signup', 'index')}</a></span>
                </div>
            `;
        
            form.querySelector('#signup-container a').addEventListener('click', e => {
                const content = document.querySelector('.modal#signin #content');
                content.innerHTML = '';
                content.appendChild(formSignup.get());
            });
            
            return form;
        })());

        if (!TemplateVar.get('localServer')) {
            GoogleLogin.renderButton(formSignin.get('#google-signin'));
        }

        formSignin.submit(async data => {
            // console.log(data);
            try {
                const response = await new User({
                    email: data['email'],
                    password: data['password'],
                }).login();
                // console.log(response);
    
                new Toast(translate('signin.response.success', 'index'), { type: 'success' });
                location.href = '/dashboard';
            }
            catch (error) {
                console.error(error);
                new Toast(translate('signin.response.invalid', 'index'), { type: 'error' });
            }
        });
    }
    if (!formSignup) {
        formSignup = new Form((() => {
            const form = document.createElement('form');
            form.id = 'signup';
            form.innerHTML = `
                <h1>${translate('signup.h1', 'index')}</h1>
                <input id="name" type="text" name="name" placeholder="${translate('signup.name', 'index')}" required>
                <input id="last-name" type="text" name="last-name" placeholder="${translate('signup.last-name', 'index')}" required>
                <input id="email" type="email" name="email" placeholder="${translate('signup.email', 'index')}" required>
                <input id="password" type="password" name="password" placeholder="${translate('signup.password', 'index')}" required>
                <input id="confirm" type="password" name="confirm" placeholder="${translate('signup.confirm-password', 'index')}" required>
                <div id="button-container">
                    <button id="button" type="submit" class="default">${translate('signup.button', 'index')}</button>
                </div>
                <div id="signin-container" class="bottom-link">
                    <span>${translate('signup.have-account', 'index')}<a>${translate('signup.signin', 'index')}</a></span>
                </div>
            `;
    
            form.querySelector('#signin-container a').addEventListener('click', e => {
                const content = document.querySelector('.modal#signin #content');
                content.innerHTML = '';
                content.appendChild(formSignin.get());
            });
            
            return form;
        })());
        formSignup.submit(async data => {
            // console.log(data);
            if (!formSignup.validate([
                {
                    id: 'name',
                    rule: value => value.length,
                    message: translate('signup.validation.name', 'index')
                },
                {
                    id: 'last-name',
                    rule: value => value.length,
                    message: translate('signup.validation.last-name', 'index')
                },
                {
                    id: 'email',
                    rule: Form.VALIDATION_RULES.EMAIL,
                    message: translate('signup.validation.email', 'index')
                },
                {
                    id: 'password',
                    rule: value => value.length >= 8,
                    message: translate('signup.validation.password', 'index')
                },
                {
                    id: 'confirm',
                    rule: (value, inputs) => value === inputs.password.value,
                    message: translate('signup.validation.confirm', 'index')
                },
            ])) return;

            try {
                const response = await new User({
                    name: data['name'],
                    lastName: data['last-name'],
                    email: data['email'],
                    password: data['password'],
                }).add();
                console.log(response);
    
                // if the user was created, show a success message
                if (response.status === 201) {
                    new Toast(translate('signup.response.success', 'index'), { type: 'success' });
                    modal.close();
                }
                // user exists and password was updated
                else if (response.status === 200 && response.updated === true) {
                    new Toast(translate('signup.response.updated', 'index'), { type: 'success' });
                    modal.close();
                }
            }
            catch (error) {
                // console.error(error);
                new Toast(translate(error.message, 'api'), { type: 'error' });
            }

        });
    }
    
    modal = new Modal(formSignin.get(), { id: 'signin' });
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
