import { Router } from 'express';
import { getInvoices, getInvoice, createInvoice, updateInvoice, updateInvoiceStatus } from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createInvoiceSchema, updateInvoiceStatusSchema } from '../validators/invoice.validator';

const router = Router();
router.use(authenticate);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', validate(createInvoiceSchema), createInvoice);
router.put('/:id', updateInvoice);
router.patch('/:id/status', validate(updateInvoiceStatusSchema), updateInvoiceStatus);
export default router;
