import GoogleLogin from "./helpers/google-login.js";
import TemplateVar from "./helpers/template-var.js";
import User from "./model/user.js";
import Menu from "./components/menu.js";
import Header from "./components/header.js";
import problems from "./dashboard-problem.js";
import { translations } from "./components/footer.js";

import '../less/dashboard.less';

const menu = new Menu({
    items: [
        { id: 'dashboard', text: translations['menu-dashboard'], icon: 'fas fa-tachometer-alt' },
        { id: 'problems', text: translations['menu-problems'], icon: 'fas fa-tasks', action: () => problems.build() },
        { id: 'contests', text: translations['menu-contests'], icon: 'fas fa-trophy' },
        { id: 'teams', text: translations['menu-teams'], icon: 'fas fa-users' },
        { id: 'logout', text: translations['menu-logout'], icon: 'fas fa-sign-out-alt' },
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
