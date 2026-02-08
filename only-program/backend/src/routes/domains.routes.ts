import { Router } from 'express';
import { searchDomains, buyDomain } from '../controllers/domains.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/search', searchDomains);
router.post('/buy', authenticateToken, buyDomain);

export default router;
