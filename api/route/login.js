import { Router } from 'express';
import User from '../model/user.js';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';

const router = Router();

// Login a user
// if google token is provided, create a new user or return the existing one
// if password is provided, return the user

router.post('/', auth({
    'user:token': true,
    'user:password': true,
}), async (req, res, next) => {
    // passed the verification: google token or password
    try {
        // check if there is a token: google token
        const payload = req.authPayload;
        let user;
        if (payload) {
            user = await (async () => {
                // Check if the user already exists
                try {
                    const user = await new User({ google_id: payload.sub }).getBy('google_id');
                    return { 
                        status: 200,
                        user: {
                            email: user.email,
                            name: user.name,
                            lastName: user.last_name,
                            picture: user.picture
                        }
                    }
                }
                catch (error) {
                    // if not, create a new user
        
                    if (error.code !== 404) {
                        throw error;
                    }
        
                    const newUser = await new User({
                        google_id: payload.sub,
                        email: payload.email,
                        name: payload.given_name,
                        last_name: payload.family_name,
                        picture: payload.picture,
                    }).insert();
        
                    return {
                        status: 201,
                        message: 'User created.',
                        user: {
                            email: newUser.email,
                            name: newUser.name,
                            lastName: newUser.last_name,
                            picture: newUser.picture
                        }
                    }
                }
            })();
        }
        // if there is no token, then there is a password
        else {
            const { email, password } = req.body;
            // auth passed, but user not found: create a new user
            if (req.user === null) {
                const newUser = await new User({
                    email,
                    password,
                    name: req.body.name,
                    last_name: req.body.lastName,
                }).insert();
                user = {
                    status: 201,
                    message: 'User created.',
                    user: {
                        email: newUser.email,
                        name: newUser.name,
                        lastName: newUser.last_name,
                    }
                }
            }
            // auth passed, and user found, but no password: create a password
            else if (!req.user.password) {
                const updatedUser = await new User({ email }).getBy('email').then(user => user.updatePassword(password));
                user = {
                    status: 200,
                    message: 'Password updated.',
                    user: {
                        email: updatedUser.email,
                        name: updatedUser.name,
                        lastName: updatedUser.last_name,
                        picture: updatedUser.picture
                    }
                }
            }
            // regular login
            else {
                user = {
                    status: 200,
                    user: {
                        email: req.user.email,
                        name: req.user.name,
                        lastName: req.user.last_name,
                        picture: req.user.picture,
                        token: req.user.token,
                    }
                }
            }
        }

        res.status(user.status).send({
            message: user.message,
            user: user.user
        });
    }
    catch (error) {
        next(error);
    }
});

export default router;