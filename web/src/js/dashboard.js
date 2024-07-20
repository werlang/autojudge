import GoogleLogin from "./helpers/google-login.js";
import TemplateVar from "./helpers/template-var.js";
import User from "./model/user.js";
import Menu from "./components/menu.js";
import Header from "./components/header.js";

import '../less/dashboard.less';

const menu = new Menu({
    items: [
        { id: 'dashboard', text: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    ],
})

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
        console.log(user);
        return user;
    }
    catch (error) {
        console.error(error);
        GoogleLogin.removeCredential();
        location.href = '/';
    }
})();

new Header({
    user,
    menu,
});
