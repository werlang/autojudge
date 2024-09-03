import Translator from "./helpers/translate.js";
import Pledge from "./helpers/pledge.js";
import Menu from "./components/menu.js";
import Header from "./components/header.js";
import Modal from "./components/modal.js";
import Team from "./model/team.js";
import Toast from "./components/toast.js";
import TemplateVar from "./helpers/template-var.js";
import Form from "./components/form.js";
import ModuleLoader from "./helpers/module-loader.js";

import '../less/team.less';

const translatePledge = new Pledge();
new Translator(['en', 'pt'], [
    'components',
    'common',
    'team',
    'api',
    'problem',
]).init().then(translate => translatePledge.resolve(translate));
const translate = await translatePledge;


// check the logged team or create a modal asking for the password
const teamHandler = {
    init: async function() {
        if (this.team) return this.team;

        const token = Team.getToken();
        if (!token) {
            this.showPasswordModal();
            return false;
        }
        this.token = token;

        const team = await this.getTeam();
        // console.log(team);

        if (!team) {
            Team.removeToken();
            this.showPasswordModal();
            return false;
        }

        this.team = team;
        this.loaded = true;
        return team;
    },

    waitLoad: async function() {
        if (this.loaded) return this.team;
        return new Promise(resolve => {
            setTimeout(async () => {
                resolve(await this.waitLoad());
            }, 100);
        })
    },

    showPasswordModal: function() {
        // show modal requesting team password
        const modal = new Modal(`
            <h2>${translate('join-team', 'team')}</h2>
            <p>${translate('ask-password', 'team')}</p>
            <form>
                <input id="password" type="password" placeholder="${translate('password', 'common')}">
                ${TemplateVar.get('teamId') ? '' : `<input id="team-id" type="text" placeholder="${translate('team-id', 'team')}">`}
                <div id="button-container"><button id="submit" class="default">${translate('send', 'common')}</button></div>
            </form>
        `, { fog: { close: false, dark: true } })

        const form = new Form(modal.get('form'));
        form.submit(async data => {
            if (!form.validate([
                { id: 'password', rule: value => value.length == 6 && !isNaN(value), message: translate('password-format', 'team') },
                { id: 'team-id', rule: value => value.length, message: translate('team-id-format', 'team') },
            ])) return;

            try {
                const resp = await new Team({
                    id: data['team-id'] || TemplateVar.get('teamId'),
                    password: data['password']
                }).login();
                // console.log(resp);
                location.href = '/teams';
            }
            catch (error) {
                new Toast(translate(error.message, 'api'), { type: 'error' });
                // console.log(error);
                return;
            }
        });
    },

    getTeam: async function() {
        if (this.team) return this.team;

        try {
            const {team} = await new Team({ id: TemplateVar.get('teamId') }).get();
            return team;
        }
        catch (error) {
            return false;
        }
    },

    removeTeam: function() {
        Team.removeToken();
        location.href = '/';
    }
}


teamHandler.init().then(team => {
    if (!team) return;
    
    const ml = new ModuleLoader({ translate, team });
    
    const menu = new Menu({
        items: [
            { id: 'teams', text: translate('teams_one', 'common'), icon: 'fas fa-users', action: () => ml.load('team-submission.js', { refresh: true}) },
            { id: 'contests', path:'teams/contest', text: translate('contest_one', 'common'), icon: 'fas fa-trophy', action: () => ml.load('team-contest.js', { refresh: true}) },
            { id: 'problems', path: 'teams/problems', text: translate('problem_other', 'common'), icon: 'fas fa-tasks', action: () => ml.load('team-problem.js') },
            { id: 'logout', text: translate('menu.logout', 'components'), icon: 'fas fa-sign-out-alt', action: () => teamHandler.removeTeam() },
        ],
        options: {
            usePath: true,
            reload: true,
        },
    });

    new Header({ menu, team });

    const problemHash = TemplateVar.get('problemHash');
    if (problemHash) {
        ml.load('team-single-problem.js', {team: teamHandler.team, problemHash });
        return;
    }
});
    
