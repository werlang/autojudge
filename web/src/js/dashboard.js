import GoogleLogin from "./helpers/google-login.js";
import TemplateVar from "./helpers/template-var.js";
import User from "./model/user.js";
import Menu from "./components/menu.js";
import Header from "./components/header.js";
import Translator from "./helpers/translate.js";
import Pledge from "./helpers/pledge.js";
import LocalData from "./helpers/local-data.js";

import '../less/dashboard.less';

// TODO: Create dashboard view

const translatePledge = new Pledge();
new Translator(['en', 'pt'], [
    'components',
    'dashboard',
    'problem',
    'common',
    'contest',
    'api',
]).init().then(translate => translatePledge.resolve(translate));

// handle redirect from google login
function handleRedirect() {
    const credential = TemplateVar.get('googleCredential');
    // console.log(credential);
    if (credential) {
        GoogleLogin.saveCredential(credential);
        new LocalData({ id: 'redirect-message' }).remove();
    }
}
handleRedirect();

const userPledge = new Pledge();
// get logged user
(async () => {
    try {
        const user = await new User().get();
        // console.log(user);
        userPledge.resolve(user);
    }
    catch (error) {
        // allow to show problem even if not logged
        if (TemplateVar.get('problemHash')) {
            userPledge.resolve({});
            return;
        }

        console.error(error);
        // set expired token so index can show the message
        if (error.message === 'Invalid token.') {
            GoogleLogin.removeCredential();
            new LocalData({ id: 'redirect-message' }).set({ data: 'expired' });
        }
        location.href = '/';
    }
})();

const menuPledge = new Pledge();
translatePledge.then(translate => {
    const menu = new Menu({
        items: [
            { id: 'dashboard', text: translate('menu.dashboard', 'components'), icon: 'fas fa-tachometer-alt', action: () => moduleLoader('dashboard-home.js') },
            { id: 'problems', text: translate('menu.problems', 'components'), icon: 'fas fa-tasks', action: () => moduleLoader('dashboard-problem.js') },
            { id: 'contests', text: translate('menu.contests', 'components'), icon: 'fas fa-trophy', action: () => moduleLoader('dashboard-contest.js') },
            { id: 'logout', text: translate('menu.logout', 'components'), icon: 'fas fa-sign-out-alt' },
        ],
        options: {
            usePath: true,
            reload: true,
        }
    })
    .addAction('logout', async () => {
        GoogleLogin.removeCredential();
        new LocalData({ id: 'redirect-message' }).set({ data: 'logout' });
        location.href = '/';
    });
    
    menuPledge.resolve(menu);

    async function moduleLoader(name, objects = {}) {
        // console.log(objects);
        const module = await import('./'+ name);
        const entity = module.default;
        entity.translate = translate;
        for (const key in objects) {
            entity[key] = objects[key];
        }
        entity.build();
        return entity;
    }

    // check for single problem page
    (async () => {
        const hash = TemplateVar.get('problemHash');
        if (hash && location.pathname === `/problems/${hash}`) {
            // lazy load problem
            const module = await import('./dashboard-single-problem.js');
            const problem = module.default
            problem.translate = translate;
            problem.load(hash);
        }
    })();

    // check for single contest page
    (async () => {
        const id = TemplateVar.get('contestId');
        if (id && location.pathname === `/contests/${id}`) {
            // lazy load contest
            const module = await import('./dashboard-single-contest.js');
            const contest = module.default
            contest.translate = translate;
            contest.load(id);
        }
    })();
});

Pledge.all([userPledge, menuPledge]).then(([{user}, menu]) => {
    new Header({ user, menu, });
});
