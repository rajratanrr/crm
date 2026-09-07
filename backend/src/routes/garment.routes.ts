import { Router } from 'express';
import { getGarments, createGarment, updateGarment, deleteGarment } from '../controllers/fashion.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getGarments);
router.post('/', createGarment);
router.put('/:id', updateGarment);
router.delete('/:id', deleteGarment);

export default router;
