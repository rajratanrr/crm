import { Router } from 'express';
import { getContracts, getContract, createContract, updateContract, updateContractStatus } from '../controllers/contract.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createContractSchema, updateContractSchema, updateContractStatusSchema } from '../validators/contract.validator';

const router = Router();
router.use(authenticate);
router.get('/', getContracts);
router.get('/:id', getContract);
router.post('/', validate(createContractSchema), createContract);
router.put('/:id', validate(updateContractSchema), updateContract);
router.patch('/:id/status', validate(updateContractStatusSchema), updateContractStatus);
export default router;
