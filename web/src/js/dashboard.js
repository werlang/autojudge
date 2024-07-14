import GoogleLogin from "./helpers/google-login.js";
import TemplateVar from "./helpers/template-var.js";
import User from "./model/user.js";


// user login flow
(async () => {
    const credential = TemplateVar.get('googleCredential');
    // console.log(credential);
    if (credential) {
        GoogleLogin.saveCredential(credential);
    }

    try {
        const user = await new User().get();
        console.log(user);
    }
    catch (error) {
        console.error(error);
        location.href = '/';
    }
})();