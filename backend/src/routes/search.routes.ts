import { Router } from 'express';
import { getSearchResults } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', getSearchResults);
export default router;
