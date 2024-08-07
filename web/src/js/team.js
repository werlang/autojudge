import TemplateVar from "./helpers/template-var.js";
import Translator from "./helpers/translate.js";
import Pledge from "./helpers/pledge.js";

import '../less/team.less';

const translatePledge = new Pledge();
new Translator(['en', 'pt'], [
    'components',
    'common',
    'team',
]).init().then(translate => translatePledge.resolve(translate));

console.log(TemplateVar.get('teamId'));

translatePledge.then(translate => {
    console.log(translate('hello', 'team'));
});
