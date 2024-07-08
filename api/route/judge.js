import { Router } from 'express';
import Request from '../helpers/request.js';

const router = Router();

// run code sending code, inputs and outputs as zip file
router.post('/', async (req, res, next) => {
    try {
        // console.log(req.body)
        
        const request = new Request({ url: `http://judge:3000` });
        const response = await request.post('', {
            format: 'json',
            filename: req.body.filename,
            code: req.body.code,
            tests: req.body.tests,
        });
        
        res.send({ message: response });
    }
    catch (err) {
        next(err);
    }
});

export default router;