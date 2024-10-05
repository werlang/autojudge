// Google Login helper
// USAGE:
// GoogleLogin.init({ redirectUri }); // initialize the google login. redirectUri is the uri to redirect after login
// GoogleLogin.onFail(() => {}); // callback when the login fails (no account selected)
// GoogleLogin.onSignIn(() => {}); // callback when the login is successful
// GoogleLogin.prompt(); // prompt the user to login. It will redirect to ask for the google account or automatically login if the account is already selected. This is asynchronous, so you can await it.
// GoogleLogin.getCredential(); // get the google credential if it is saved (logged)
// GoogleLogin.saveCredential(credential); // save the google credential (login)
// GoogleLogin.removeCredential(); // remove the google credential (logout)
// GoogleLogin.isLoaded(); // check if the google login is loaded
// GoogleLogin.renderButton(element); // render the google login button in the element


import TemplateVar from './template-var.js';
import DynamicScript from './dynamic-script.js';
import Pledge from './pledge.js';
import LocalData from './local-data.js';
import Translator from './translate.js';


export default class GoogleLogin {

    static logged = false;
    static loaded = false;

    static async init({ redirectUri }) {
        if (GoogleLogin.loaded) {
            return GoogleLogin;
        }
        if (!redirectUri) {
            throw new Error('redirectUri not set');
        }

        const pledge = new Pledge();

        new DynamicScript('https://accounts.google.com/gsi/client', () => {
            async function handleCredentialResponse(response) {
                // console.log(response.credential);
                GoogleLogin.logged = true;
                GoogleLogin.saveCredential(response.credential);
            }

            google.accounts.id.initialize({
                client_id: TemplateVar.get('googleClientId'),
                callback: handleCredentialResponse,
                auto_select: true,
                ux_mode: 'redirect',
                login_uri: redirectUri,
                // use_fedcm_for_prompt: true,
            });

            GoogleLogin.loaded = true;
            pledge.resolve(GoogleLogin);
        });

        return pledge.get();
    }

    static isLoaded() {
        return GoogleLogin.loaded;
    }

    static renderButton(element) {
        if (!GoogleLogin.loaded) {
            throw new Error('GoogleLogin not loaded');
        }
        // You can skip the next instruction if you don't want to show the "Sign-in" button
        google.accounts.id.renderButton(
            element, // Ensure the element exist and it is a div to display correcctly
            {
                theme: "outline",
                size: "large",
                locale: Translator.currentLanguage(),
                width: '350',
            }
        );
    }

    static async prompt() {
        if (!GoogleLogin.loaded) {
            throw new Error('GoogleLogin not loaded');
        }
        google.accounts.id.prompt(notification => {
            if (!notification.isNotDisplayed()) return;
            if (GoogleLogin.onFailCallback) GoogleLogin.onFailCallback(notification);
        });

        await GoogleLogin.waitLogged();
    }

    static async waitLogged() {
        const pledge = new Pledge();
        let interval = setInterval(() => {
            if (GoogleLogin.logged) {
                clearInterval(interval);
                pledge.resolve();
            }
        }, 1000);
        return pledge.get();
    }

    static onFail(callback) {
        GoogleLogin.onFailCallback = callback;
        return GoogleLogin;
    }

    static saveCredential(credential) {
        new LocalData({ id: 'google-credential' }).set({ data: credential });
        if (GoogleLogin.onSignInCallback) GoogleLogin.onSignInCallback(credential);
    }

    static getCredential() {
        return new LocalData({ id: 'google-credential' }).get();
    }

    static removeCredential() {
        new LocalData({ id: 'google-credential' }).remove();
    }

    static onSignIn(callback) {
        GoogleLogin.onSignInCallback = callback;
        return GoogleLogin;
    }
}