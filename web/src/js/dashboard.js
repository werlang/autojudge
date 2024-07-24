import GoogleLogin from "./helpers/google-login.js";
import TemplateVar from "./helpers/template-var.js";
import User from "./model/user.js";
import Menu from "./components/menu.js";
import Header from "./components/header.js";
import problems from "./dashboard-problem.js";
import Translator from "./helpers/translate.js";

import '../less/dashboard.less';

const translate = await new Translator(['en', 'pt'], ['components', 'dashboard', 'problem']).init();
problems.translate = translate;

const menu = new Menu({
    items: [
        { id: 'dashboard', text: translate('menu.dashboard', 'components'), icon: 'fas fa-tachometer-alt' },
        { id: 'problems', text: translate('menu.problems', 'components'), icon: 'fas fa-tasks', action: () => problems.build() },
        { id: 'contests', text: translate('menu.contests', 'components'), icon: 'fas fa-trophy' },
        { id: 'teams', text: translate('menu.teams', 'components'), icon: 'fas fa-users' },
        { id: 'logout', text: translate('menu.logout', 'components'), icon: 'fas fa-sign-out-alt' },
    ],
    options: {
        usePath: true,
        reload: true,
    }
})
.addAction('logout', async () => {
    GoogleLogin.removeCredential();
    location.href = '/';
});

// handle redirect from google login
function handleRedirect() {
    const credential = TemplateVar.get('googleCredential');
    // console.log(credential);
    if (credential) {
        GoogleLogin.saveCredential(credential);
    }
}
handleRedirect();

// get logged user
const {user} = await (async () => {
    try {
        const user = await new User().get();
        // console.log(user);
        return user;
    }
    catch (error) {
        console.error(error);
        // set expired token so index can show the message
        if (error.message === 'Invalid token.') {
            GoogleLogin.saveCredential('expired');
        }
        location.href = '/';
    }
})();

new Header({ user, menu, });
