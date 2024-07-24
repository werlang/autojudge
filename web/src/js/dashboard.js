import GoogleLogin from "./helpers/google-login.js";
import TemplateVar from "./helpers/template-var.js";
import User from "./model/user.js";
import Menu from "./components/menu.js";
import Header from "./components/header.js";
import Translator from "./helpers/translate.js";
import Pledge from "./helpers/pledge.js";

import '../less/dashboard.less';

const translatePledge = new Pledge();
new Translator(['en', 'pt'], ['components', 'dashboard', 'problem', 'common']).init().then(translate => translatePledge.resolve(translate));

const userPledge = new Pledge();
// get logged user
(async () => {
    try {
        const user = await new User().get();
        // console.log(user);
        userPledge.resolve(user);
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

const menuPledge = new Pledge();
translatePledge.then(translate => {
    const menu = new Menu({
        items: [
            { id: 'dashboard', text: translate('menu.dashboard', 'components'), icon: 'fas fa-tachometer-alt' },
            { id: 'problems', text: translate('menu.problems', 'components'), icon: 'fas fa-tasks', action: problemsMenuClick },
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
    
    menuPledge.resolve(menu);

    async function problemsMenuClick() {
        // lazy load problems
        const module = await import('./dashboard-problem.js');
        const problems = module.default
        problems.translate = translate;
        problems.build();
    }

    // check for single problem page
    (async () => {
        const id = TemplateVar.get('problemId');
        if (id && location.pathname === `/problems/${id}`) {
            // lazy load problem
            const module = await import('./dashboard-single-problem.js');
            const problem = module.default
            problem.translate = translate;
            problem.load(id);
        }
    })();
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


Pledge.all([userPledge, menuPledge]).then(([{user}, menu]) => {
    new Header({ user, menu, });
});
