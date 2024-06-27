import { Router } from 'express';
import User from '../model/user.js';
import auth from '../middleware/auth.js';

const router = Router();

router.post('/', auth, async (req, res, next) => {
    try {
        if (req.user) {
            res.send({ user: {
                email: req.user.email,
                name: req.user.name,
                lastName: req.user.lastName,
                picture: req.user.picture
            } });
            return ;
        }

        const payload = req.authPayload;

        // If the user is not found, we create a new user
        const newUser = await new User({
            googleId: payload.sub,
            email: payload.email,
            name: payload.given_name,
            lastName: payload.family_name,
            picture: payload.picture,
        }).insert();
        return res.status(201).send({ user: {
            email: newUser.email,
            name: newUser.name,
            lastName: newUser.lastName,
            picture: newUser.picture
        } });
    }
    catch (error) {
        next(error);
    }
});

export default router;