import GoogleLogin from "./helpers/google-login.js";
import TemplateVar from "./helpers/template-var.js";
import User from "./model/user.js";
import Menu from "./components/menu.js";
import Header from "./components/header.js";
import problems from "./dashboard-problem.js";
import translate from "./helpers/translate.js";

import '../less/dashboard.less';

const menu = new Menu({
    items: [
        { id: 'dashboard', text: translate('menu-dashboard'), icon: 'fas fa-tachometer-alt' },
        { id: 'problems', text: translate('menu-problems'), icon: 'fas fa-tasks', action: () => problems.build() },
        { id: 'contests', text: translate('menu-contests'), icon: 'fas fa-trophy' },
        { id: 'teams', text: translate('menu-teams'), icon: 'fas fa-users' },
        { id: 'logout', text: translate('menu-logout'), icon: 'fas fa-sign-out-alt' },
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
        GoogleLogin.removeCredential();
        location.href = '/';
    }
})();

new Header({ user, menu, });
