import GoogleLogin from "./helpers/google-login.js";
import TemplateVar from "./helpers/template-var.js";
import User from "./model/user.js";
import Menu from "./components/menu.js";
import Header from "./components/header.js";
import Translator from "./helpers/translate.js";
import Pledge from "./helpers/pledge.js";
import LocalData from "./helpers/local-data.js";

import '../less/dashboard.less';
import Contest from "./model/contest.js";

const translatePledge = new Pledge();
new Translator(['en', 'pt'], [
    'components',
    'dashboard',
    'problem',
    'common',
    'contest',
    'api',
]).init().then(translate => translatePledge.resolve(translate));

const userPledge = new Pledge();
// get logged user
(async () => {
    try {
        const user = await new User().get();
        // console.log(user);
        userPledge.resolve(user);
    }
    catch (error) {
        // console.error(error);
        // set expired token so index can show the message
        if (error.message === 'Invalid token.') {
            GoogleLogin.removeCredential();
            new LocalData({ id: 'redirect-message' }).set({ data: 'expired' });
        }
        location.href = '/';
    }
})();

const contestPledge = new Pledge();
(async () => {
    const contestId = TemplateVar.get('contestId');
    if (!contestId) location.href = '/contests';
    const {contest} = await new Contest({ id: contestId }).get();
    contestPledge.resolve(contest);
})();

const menuPledge = new Pledge();
translatePledge.then(async translate => {
    const contest = await contestPledge;
    // console.log(contest);
    
    const menu = new Menu({
        items: [
            { id: 'dashboard', path: `contests/${contest.id}/dashboard`, text: translate('menu.dashboard', 'components'), icon: 'fas fa-tachometer-alt' },
            { id: 'submissions', path: `contests/${contest.id}/submissions`, text: translate('menu.submissions', 'components'), icon: 'fas fa-file-code', action: async () => moduleLoader('contest-submission.js', {contest}) },
            { id: 'problems', path: `contests/${contest.id}/problems`, text: translate('menu.problems', 'components'), icon: 'fas fa-tasks', action: async () => moduleLoader('contest-problem.js', {contest}) },
            { id: 'teams', path: `contests/${contest.id}/teams`, text: translate('menu.teams', 'components'), icon: 'fas fa-users', action: async () => moduleLoader('contest-team.js', {contest}) },
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
        entity.build({ translate, ...objects });
        return entity;
    }
});

Pledge.all([userPledge, menuPledge]).then(([{user}, menu]) => {
    new Header({ user, menu, });
});
