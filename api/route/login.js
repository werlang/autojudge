import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';

const router = Router();

router.post('/', async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const client = new OAuth2Client();
    try {
        const ticket = await client.verifyIdToken({
            idToken: req.body.token,
            audience: clientId,  // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        // If the request specified a Google Workspace domain:
        // const domain = payload['hd'];
        
        res.send({ payload });
    }
    catch (error) {
        console.error(error);
        return res.status(400).send({ error: error.message });
    }
});

export default router;