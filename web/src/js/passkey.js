import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import TemplateVar from './helpers/template-var.js';
import Request from './helpers/request.js';

// <button>
const elemBegin = document.getElementById('btnBegin');
const elemAuth = document.getElementById('btnAuth');
// <span>/<p>/etc...
const elemSuccess = document.getElementById('success');
// <span>/<p>/etc...
const elemError = document.getElementById('error');

// Start registration when the user clicks a button
elemBegin.addEventListener('click', async () => {
    // Reset success/error messages
    elemSuccess.innerHTML = '';
    elemError.innerHTML = '';

    // GET registration options from the endpoint that calls
    // @simplewebauthn/server -> generateRegistrationOptions()
    const request = new Request({ url: `https://${TemplateVar.get('apiurl')}` });
    const resp = await request.get('passkey/register');

    let attResp;
    try {
        // Pass the options to the authenticator and wait for a response
        attResp = await startRegistration(resp);
    } catch (error) {
        // Some basic error handling
        if (error.name === 'InvalidStateError') {
            elemError.innerText = 'Error: Authenticator was probably already registered by user';
        } else {
            elemError.innerText = error;
        }

        throw error;
    }

    // POST the response to the endpoint that calls
    // @simplewebauthn/server -> verifyRegistrationResponse()
    request.setHeader('Content-Type', 'application/json');
    const verificationJSON = await request.post('passkey/register', attResp);
    console.log(verificationJSON);

    // Show UI appropriate for the `verified` status
    if (verificationJSON && verificationJSON.verified) {
        elemSuccess.innerHTML = 'Success!';
    } else {
        elemError.innerHTML = `Oh no, something went wrong! Response: <pre>${JSON.stringify(
            verificationJSON,
        )}</pre>`;
    }
});

// Start authentication when the user clicks a button
elemAuth.addEventListener('click', async () => {
    // Reset success/error messages
    elemSuccess.innerHTML = '';
    elemError.innerHTML = '';

    // GET authentication options from the endpoint that calls
    // @simplewebauthn/server -> generateAuthenticationOptions()
    const request = new Request({ url: `https://${TemplateVar.get('apiurl')}` });
    const resp = await request.get('passkey/login');

    let attResp;
    try {
        // Pass the options to the authenticator and wait for a response
        attResp = await startAuthentication(resp);
    } catch (error) {
        // Some basic error handling
        if (error.name === 'InvalidStateError') {
            elemError.innerText = 'Error: Authenticator was probably already registered by user';
        } else {
            elemError.innerText = error;
        }

        throw error;
    }

    // POST the response to the endpoint that calls
    // @simplewebauthn/server -> verifyAuthenticationResponse()
    request.setHeader('Content-Type', 'application/json');
    const verificationJSON = await request.post('passkey/login', attResp);
    console.log(verificationJSON);

    // Show UI appropriate for the `verified` status
    if (verificationJSON && verificationJSON.verified) {
        elemSuccess.innerHTML = 'Success!';
    } else {
        elemError.innerHTML = `Oh no, something went wrong! Response: <pre>${JSON.stringify(
            verificationJSON,
        )}</pre>`;
    }
});
