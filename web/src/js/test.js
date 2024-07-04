import TemplateVar from './helpers/template-var.js';
import Request from './helpers/request.js';
import DynamicScript from './helpers/dynamic-script.js';

async function handleCredentialResponse(response) {
    console.log(response.credential);
    const resp = await new Request({ 
        url: `https://${TemplateVar.get('apiurl')}`,
        headers: { 'Authorization': `Bearer ${response.credential}` }
    }).post('login');
    console.log({resp});
}

new DynamicScript('https://accounts.google.com/gsi/client', () => {
    google.accounts.id.initialize({
        client_id: TemplateVar.get('googleClientId'),
        callback: handleCredentialResponse // We choose to handle the callback in client side, so we include a reference to a function that will handle the response
        // login_uri: "https://api.localhost/test/onetap", // Replace with your login URI
    });
    // You can skip the next instruction if you don't want to show the "Sign-in" button
    google.accounts.id.renderButton(
        document.getElementById("buttonDiv"), // Ensure the element exist and it is a div to display correcctly
        { theme: "outline", size: "large" }  // Customization attributes
    );
    google.accounts.id.prompt(); // Display the One Tap dialog
});