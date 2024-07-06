import { Router } from 'express';
import Runner from '../model/runner.js';

const router = Router();

// run code sending code, inputs and outputs as zip file
router.post('/', async (req, res, next) => {
    try {
        // console.log(req.body)
        const response = await new Runner({ ...req.body, format: 'zip' }).run();
        res.send({ message: response });
    }
    catch (err) {
        next(err);
    }
});

export default router;