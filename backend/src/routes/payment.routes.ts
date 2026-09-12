import { Router } from 'express';
import {
  getPayments,
  getFinanceSummary,
  getPayment,
  createPayment,
  updatePayment,
  patchPayment,
  deletePayment,
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/finance-summary', getFinanceSummary);
router.get('/', getPayments);
router.get('/:id', getPayment);
router.post('/', createPayment);
router.put('/:id', updatePayment);
router.patch('/:id', patchPayment);
router.delete('/:id', deletePayment);

export default router;
