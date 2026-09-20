import { Router } from 'express';
import {
  getModels,
  getModel,
  createModel,
  updateModel,
  deleteModel,
  getModelPayments,
  createModelPayment,
  deleteModelPayment,
} from '../controllers/fashion.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getModels);
router.post('/', createModel);
router.get('/:id', getModel);
router.put('/:id', updateModel);
router.patch('/:id', updateModel);
router.delete('/:id', deleteModel);

// Model Payment Ledger routes
router.get('/:id/payments', getModelPayments);
router.post('/:id/payments', createModelPayment);
router.delete('/:id/payments/:paymentId', deleteModelPayment);

export default router;
