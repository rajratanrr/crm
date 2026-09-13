import { Router } from 'express';
import { getModels, getModel, createModel, updateModel, deleteModel } from '../controllers/fashion.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getModels);
router.post('/', createModel);
router.get('/:id', getModel);
router.put('/:id', updateModel);
router.patch('/:id', updateModel);
router.delete('/:id', deleteModel);

export default router;
