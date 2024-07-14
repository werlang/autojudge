import { Router } from 'express';
import User from '../model/user.js';
import auth from '../middleware/auth.js';

const router = Router();

router.post('/', auth({'user:token': true}), async (req, res, next) => {
    // passed the token verification
    try {
        const payload = req.authPayload;
        const user = await (async () => {
            // Check if the user already exists
            try {
                const user = await new User({ google_id: payload.sub }).get();
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
    
                if (!error.code === 404) {
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