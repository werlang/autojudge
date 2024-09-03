import GoogleLogin from "./helpers/google-login.js";
import TemplateVar from "./helpers/template-var.js";
import User from "./model/user.js";
import Menu from "./components/menu.js";
import Header from "./components/header.js";
import Translator from "./helpers/translate.js";
import Pledge from "./helpers/pledge.js";
import LocalData from "./helpers/local-data.js";
import ModuleLoader from "./helpers/module-loader.js";

import '../less/dashboard.less';
import Contest from "./model/contest.js";

const translatePledge = new Pledge();
new Translator(['en', 'pt'], [
    'components',
    'dashboard',
    'problem',
    'common',
    'contest',
    'team',
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
    
    const ml = new ModuleLoader({ contest, translate });

    const menu = new Menu({
        items: [
            { id: 'contest', path: `contests/${contest.id}/dashboard`, text: translate('contest_one', 'common'), icon: 'fas fa-trophy', action: async () => ml.load('contest-dashboard.js') },
            { id: 'submissions', path: `contests/${contest.id}/submissions`, text: translate('menu.submissions', 'components'), icon: 'fas fa-file-code', action: async () => ml.load('contest-submission.js', {refresh: true}) },
            { id: 'problems', path: `contests/${contest.id}/problems`, text: translate('menu.problems', 'components'), icon: 'fas fa-tasks', action: async () => ml.load('contest-problem.js') },
            { id: 'teams', path: `contests/${contest.id}/teams`, text: translate('menu.teams', 'components'), icon: 'fas fa-users', action: async () => ml.load('contest-team.js', {refresh: true}) },
            { id: 'logout', text: translate('menu.logout', 'components'), icon: 'fas fa-sign-out-alt', action: () => teamHandler.removeTeam() },
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
});

Pledge.all([userPledge, menuPledge]).then(([{user}, menu]) => {
    new Header({ user, menu, });
});
