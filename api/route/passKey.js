// This is currently not in use. This is a test file for the WebAuthn API

import { Router } from 'express';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';


const router = Router();

const rpID = 'autojudge.localhost';
const origin = `https://${rpID}`;

const user = {
    id: '1',
    username: 'user',
    devices: [],
};

// this is meant to emulate a session store
const challenges = {};

router.get('/register', async (req, res) => {
    // res.send({ message: 'Hello, World!' });

    const rpName = 'SimpleWebAuthn Example';

    const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: user.username,
        // Don't prompt users for additional information about the authenticator
        // (Recommended for smoother UX)
        attestationType: 'none',
        // Prevent users from re-registering existing authenticators
        excludeCredentials: user.devices.map(device => ({
            id: device.credentialID,
            type: 'public-key',
            // Optional
            transports: device.transports,
        })),
        // See "Guiding use of authenticators via authenticatorSelection" below
        authenticatorSelection: {
            // Defaults
            residentKey: 'discouraged',
            userVerification: 'preferred',
        },
    });

    challenges[user.id] = options.challenge;

    res.send(options);
});

router.post('/register', async (req, res) => {
    // (Pseudocode) Get `options.challenge` that was saved above
    const expectedChallenge = challenges[user.id];

    let verification;
    try {
        verification = await verifyRegistrationResponse({
            response: req.body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            requireUserVerification: false,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).send({ error: error.message });
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
        const { credentialPublicKey, credentialID, counter } = registrationInfo;

        const existingDevice = user.devices.find(device => device.credentialID === credentialID);

        if (!existingDevice) {
            /**
             * Add the returned device to the user's list of devices
             */
            user.devices.push({
                credentialPublicKey,
                credentialID,
                counter,
                transports: req.body.response.transports,
            });
        }
    }

    challenges[user.id] = undefined;

    res.send({ verified });
});

router.get('/login', async (req, res) => {
    const userPasskeys = [];

    const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: user.devices.map(device => ({
            id: device.credentialID,
            type: 'public-key',
            transports: device.transports,
        })),
        userVerification: 'preferred',
    });

    challenges[user.id] = options.challenge;

    res.send(options);
});

router.post('/login', async (req, res) => {
    const expectedChallenge = challenges[user.id];

    const authenticator = user.devices.find(device => device.credentialID === req.body.id);
    if (!authenticator) {
        return res.status(400).send({ error: 'Unknown device' });
    }

    let verification;
    try {
        verification = await verifyAuthenticationResponse({
            response: req.body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator,
            requireUserVerification: false,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).send({ error: error.message });
    }

    const { verified, authenticationInfo } = verification;

    if (verified && authenticationInfo) {
        authenticator.counter = authenticationInfo.newCounter;
    }

    challenges[user.id] = undefined;

    res.send({ verified });
});

export default router;