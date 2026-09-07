import { Router } from 'express';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, bulkImportCustomers } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCustomerSchema, updateCustomerSchema, bulkImportCustomerSchema } from '../validators/customer.validator';

const router = Router();
router.use(authenticate);
router.get('/', getCustomers);
router.post('/bulk-import', validate(bulkImportCustomerSchema), bulkImportCustomers);
router.get('/:id', getCustomer);
router.post('/', validate(createCustomerSchema), createCustomer);
router.put('/:id', validate(updateCustomerSchema), updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
