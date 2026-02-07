import { Router } from 'express';
import path from 'path';
import { generateChallenge, verifyPoW, generateToken } from '../utils/pow.util';

const router = Router();

// 1. Servir el HTML del desafío
router.get('/', (req, res) => {
    const { prefix, difficulty } = generateChallenge();
    const back = req.query.back as string || '/';

    if (!req.query.prefix) {
        return res.redirect(`/challenge?prefix=${prefix}&difficulty=${difficulty}&back=${encodeURIComponent(back)}`);
    }

    res.sendFile(path.join(__dirname, '../views/challenge.html'));
});

// 2. Verificar la solución del POW
router.get('/verify', (req, res) => {
    const { prefix, nonce, back } = req.query;

    if (!prefix || !nonce) {
        return res.status(400).send('Missing parameters');
    }

    const isValid = verifyPoW(String(prefix), parseInt(String(nonce)));

    if (isValid) {
        const ip = req.ip || req.connection.remoteAddress || '';
        const token = generateToken(String(ip));

        res.cookie('pow_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600 * 1000
        });

        return res.redirect(String(back));
    } else {
        return res.status(403).send('Verification Failed');
    }
});

export default router;
