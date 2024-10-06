import { Router } from 'express';
import User from '../model/user.js';
import auth from '../middleware/auth.js';
import CustomError from '../helpers/error.js';

const router = Router();

// Login a user with email and password

router.post('/', auth({ 'user:password': true }), async (req, res, next) => {
    try {
        // auth passed, but user not found: create a new user
        if (req.user === null) {
            throw new CustomError(404, 'User not found.');
        }
        else if (!req.user.password) {
            throw new CustomError(401, 'Password not set. Please use the register endpoint.');
        }

        res.status(200).send({
            status: 200,
            type: 'password',
            user: {
                email: req.user.email,
                name: req.user.name,
                lastName: req.user.last_name,
                picture: req.user.picture,
                token: req.user.token,
            }
        });
        return;
    }
    catch (error) {
        next(error);
    }
});


// Register a new user

router.post('/register', auth({ 'user:password': true }), async (req, res, next) => {
    try {
        const { email, password, name, lastName } = req.body;

        if (!email || !password || !name || !lastName) {
            throw new CustomError(400, 'Missing required fields.');
        }
        
        // auth passed, but user not found: create a new user
        if (req.user === null) {
            const newUser = await new User({
                email,
                password,
                name: req.body.name,
                last_name: req.body.lastName,
            }).insert();
            res.status(201).send({
                status: 201,
                type: 'password',
                created: true,
                message: 'User created.',
                user: {
                    email: newUser.email,
                    name: newUser.name,
                    lastName: newUser.last_name,
                }
            });
            return;
        }

        // auth passed, and user found, but no password: create a password
        if (!req.user.password) {
            const updatedUser = await new User({ email }).getBy('email').then(user => user.updatePassword(password));
            res.status(200).send({
                status: 200,
                updated: true,
                message: 'Password updated.',
                user: {
                    email: updatedUser.email,
                    name: updatedUser.name,
                    lastName: updatedUser.last_name,
                    picture: updatedUser.picture
                }
            });
            return;
        }
        
        throw new CustomError(409, 'User already exists.');
    }
    catch (error) {
        next(error);
    }
});


// Login a user
// if google token is provided, create a new user or return the existing one

router.post('/google', auth({ 'user:token': true }), async (req, res, next) => {
    // passed the verification: google token or password
    try {
        // check if there is a token: google token
        const payload = req.authPayload;
        const user = await (async () => {
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
                    created: true,
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

        res.status(user.status).send({ ...user});
    }
    catch (error) {
        next(error);
    }
});

export default router;