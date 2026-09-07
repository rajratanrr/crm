import { Router } from 'express';
import { getModels, createModel, updateModel, deleteModel } from '../controllers/fashion.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getModels);
router.post('/', createModel);
router.put('/:id', updateModel);
router.delete('/:id', deleteModel);

export default router;
