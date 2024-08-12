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
        const savedTeam = this.getTeam();
        // console.log(savedTeam);
        if (!savedTeam) {
            this.showPasswordModal();
            return;
        }
    },

    showPasswordModal: function() {
        // show modal requesting team password
        const modal = new Modal(`
            <h2>${translate('join-team', 'team')}</h2>
            <p>${translate('ask-password', 'team')}</p>
        `, { fog: { close: false, dark: true } })
        .addInput({ id: 'password', type: 'password', placeholder: translate('password', 'common') })
        .addButton({ id: 'submit', text: translate('send', 'common'), callback: async () => {
            const team = await new Team({
                id: TemplateVar.get('teamId'),
                password: modal.getInput('password').value,
            }).get();
            // console.log(team);
            
            if (team.error) {
                new Toast(translate('wrong-password', 'team'), { type: 'error' });
                return;
            }
        
            modal.close();
            this.setTeam(team.team);
        }});
    },

    getTeam: function() {
        const team = new LocalData({ id: 'logged-team' }).get();
        this.team = team;
        return team;
    },

    setTeam: function(team) {
        this.team = team;
        return new LocalData({ id: 'logged-team', }).set({ data: team, expires: '12h'});
    },

    removeTeam: function() {
        new LocalData({ id: 'logged-team' }).remove();
        location.href = '/';
    },
}
await teamHandler.init();


const menu = new Menu({
    items: [
        { id: 'team', text: translate('teams_one', 'common'), icon: 'fas fa-users', action: () => moduleLoader('team-info.js', {team: teamHandler.team}) },
        { id: 'contests', text: translate('contest_one', 'common'), icon: 'fas fa-trophy', action: () => moduleLoader('team-contest.js') },
        { id: 'problems', text: translate('problem_other', 'common'), icon: 'fas fa-tasks' },
        { id: 'submissions', text: translate('submissions_other', 'common'), icon: 'fas fa-file-code' },
        { id: 'logout', text: translate('menu.logout', 'components'), icon: 'fas fa-sign-out-alt', action: () => teamHandler.removeTeam() },
    ],
});


async function moduleLoader(name, objects = {}) {
    const module = await import('./'+ name);
    const entity = module.default;
    entity.build({ translate, ...objects });
    return entity;
}


new Header({ menu, });

menu.click('team');
