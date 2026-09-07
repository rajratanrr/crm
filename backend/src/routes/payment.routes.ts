import { Router } from 'express';
import { getPayments, getPayment, createPayment, deletePayment, getPaymentStats } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPaymentSchema } from '../validators/payment.validator';

const router = Router();
router.use(authenticate);
router.get('/stats', getPaymentStats);
router.get('/', getPayments);
router.get('/:id', getPayment);
router.post('/', validate(createPaymentSchema), createPayment);
router.delete('/:id', deletePayment);
export default router;
