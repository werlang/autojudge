import TemplateVar from './template-var.js';
import DynamicScript from './dynamic-script.js';
import Pledge from './pledge.js';
import LocalData from './local-data.js';


export default class GoogleLogin {

    static logged = false;
    static loaded = false;
    static expireTime = '1h';

    static async init() {
        if (GoogleLogin.loaded) {
            return GoogleLogin;
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
                login_uri: `https://${window.location.hostname}/dashboard`,
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
            { theme: "outline", size: "large" }  // Customization attributes
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
        new LocalData({ id: 'google-credential' }).set({ data: credential, expires: GoogleLogin.expireTime });
        if (GoogleLogin.onSignInCallback) GoogleLogin.onSignInCallback(credential);
    }

    static getCredential() {
        return new LocalData({ id: 'google-credential' }).get();
    }

    static removeCredential() {
        new LocalData({ id: 'google-credential' }).remove();
    }

    static refreshCredential() {
        const credential = GoogleLogin.getCredential();
        if (credential) {
            GoogleLogin.saveCredential(credential);
        }
    }

    static onSignIn(callback) {
        GoogleLogin.onSignInCallback = callback;
        return GoogleLogin;
    }
}