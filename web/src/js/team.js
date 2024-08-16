import Translator from "./helpers/translate.js";
import Pledge from "./helpers/pledge.js";
import Menu from "./components/menu.js";
import LocalData from "./helpers/local-data.js";
import Header from "./components/header.js";
import Modal from "./components/modal.js";
import Team from "./model/team.js";
import Toast from "./components/toast.js";
import TemplateVar from "./helpers/template-var.js";

import '../less/team.less';

const translatePledge = new Pledge();
new Translator(['en', 'pt'], [
    'components',
    'common',
    'team',
]).init().then(translate => translatePledge.resolve(translate));
const translate = await translatePledge;


// check the logged team or create a modal asking for the password
const teamHandler = {
    init: async function() {
        const savedTeam = await this.getTeam();
        // console.log(savedTeam);
        if (!savedTeam) {
            this.showPasswordModal();
            return false;
        }
        this.team = savedTeam;
        return savedTeam;
    },

    showPasswordModal: function() {
        // show modal requesting team password
        const modal = new Modal(`
            <h2>${translate('join-team', 'team')}</h2>
            <p>${translate('ask-password', 'team')}</p>
        `, { fog: { close: false, dark: true } })
        .addInput({ id: 'password', type: 'password', placeholder: translate('password', 'common') })
        .addButton({ id: 'submit', text: translate('send', 'common'), callback: async () => {
            const password = modal.getInput('password').value;
            if (!await this.login(password)) {
                new Toast(translate('wrong-password', 'team'), { type: 'error' });
                return;
            }
            
            location.reload();
        }});
    },

    login: async function(password) {
        if (!password) return false;
        const resp = await new Team({
            id: TemplateVar.get('teamId'),
            password,
        }).login();
        // console.log(resp);
        if (resp.error) {
            return false;
        }
        return this.setCredential(resp.token);
    },

    setCredential: function(token) {
        this.token = token;
        return new LocalData({ id: 'team-credential' }).set({ data: token, expires: '12h' });
    },

    getCredential: function() {
        if (this.token) return this.token;
        const token = new LocalData({ id: 'team-credential' }).get();
        if (!token) return false;
        this.token = token;
        return token;
    },

    getTeam: async function() {
        if (this.team) return this.team;
        const token = this.getCredential();
        if (!token) return false;
        const {team} = await new Team({
            id: TemplateVar.get('teamId'),
            token,
        }).get();
        return team;
    },
}

const menu = new Menu({
    items: [
        { id: 'team', text: translate('teams_one', 'common'), icon: 'fas fa-users', action: () => moduleLoader('team-submission.js', {team: teamHandler.team, token: teamHandler.token, refresh: true}) },
        { id: 'contests', text: translate('contest_one', 'common'), icon: 'fas fa-trophy', action: () => moduleLoader('team-contest.js', {team: teamHandler.team, token: teamHandler.token, refresh: true}) },
        { id: 'problems', text: translate('problem_other', 'common'), icon: 'fas fa-tasks' },
        { id: 'logout', text: translate('menu.logout', 'components'), icon: 'fas fa-sign-out-alt', action: () => teamHandler.removeTeam() },
    ],
});


async function moduleLoader(name, objects = {}) {
    // console.log(objects);
    const module = await import('./'+ name);
    const entity = module.default;
    entity.build({ translate, ...objects });
    return entity;
}


new Header({ menu, });

teamHandler.init().then(team => {
    if (!team) return;
    menu.click('team');
});
    
