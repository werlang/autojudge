import { OAuth2Client } from 'google-auth-library';
import CustomError from "../helpers/error.js";
import User from "../model/user.js";

async function validateGoogleToken(headers) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const client = new OAuth2Client();

    if (!headers.authorization) {
        throw new CustomError(401, 'Token not found.');
    }
    const token = headers.authorization.split(' ')[1];
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: clientId,
        });
        return ticket.getPayload();
    }
    catch (error) {
        throw new CustomError(401, 'Invalid token.', error.message);
    }
}

export default async function authUser(req, res, next) {
    try {
        const payload = await validateGoogleToken(req.headers);
        req.authPayload = payload;

        try {
            const user = await new User({ google_id: payload.sub }).get();
            req.user = user;
        }
        catch (error) {
            if (error.code === 404) {
                req.user = null;
                return next();
            }
        }
        
        next();
    }
    catch (error) {
        next(error);
    }
}