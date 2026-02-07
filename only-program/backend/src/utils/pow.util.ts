import crypto from 'crypto';

/**
 * Proof of Work (PoW) Shield
 * Obliga al cliente a gastar CPU para demostrar que es un navegador real.
 * Dificultad ajustable (ajustar NUM_ZEROS según carga deseada).
 */

const SECRET_SALT = process.env.POW_SECRET || 'super-secret-salt-protector-9000';
const DEFAULT_DIFFICULTY = 3; // Número de ceros al inicio del hash (HEX). 3 es rápido, 4 es pesado, 5 es brutal.

export const generateChallenge = () => {
    // Generamos un string aleatorio único para este desafío
    const prefix = crypto.randomBytes(8).toString('hex');
    return {
        prefix,
        difficulty: DEFAULT_DIFFICULTY
    };
};

export const verifyPoW = (prefix: string, nonce: number, difficulty: number = DEFAULT_DIFFICULTY): boolean => {
    const input = `${prefix}${nonce}`;
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    const target = '0'.repeat(difficulty);

    return hash.startsWith(target);
};

export const generateToken = (ip: string) => {
    const timestamp = Date.now();
    const payload = `${ip}-${timestamp}`;
    const signature = crypto.createHmac('sha256', SECRET_SALT).update(payload).digest('hex');
    return `${payload}.${signature}`;
};

export const verifyToken = (token: string, ip: string) => {
    try {
        const [payload, signature] = token.split('.');
        const [tokenIp, timestamp] = payload.split('-');

        if (tokenIp !== ip) return false;

        // Expiración de 1 hora
        if (Date.now() - parseInt(timestamp) > 3600 * 1000) return false;

        const expectedSignature = crypto.createHmac('sha256', SECRET_SALT).update(payload).digest('hex');
        return signature === expectedSignature;
    } catch (e) {
        return false;
    }
};
