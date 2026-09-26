import { Router } from 'express';
import { getDeliverables, getDeliverable, createDeliverable, updateDeliverable, updateDeliverableStatus, deleteDeliverable } from '../controllers/deliverable.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createDeliverableSchema, updateDeliverableSchema, updateDeliverableStatusSchema } from '../validators/deliverable.validator';

const router = Router();
router.use(authenticate);
router.get('/', getDeliverables);
router.get('/:id', getDeliverable);
router.post('/', validate(createDeliverableSchema), createDeliverable);
router.put('/:id', validate(updateDeliverableSchema), updateDeliverable);
router.patch('/:id', validate(updateDeliverableSchema), updateDeliverable);
router.patch('/:id/status', validate(updateDeliverableStatusSchema), updateDeliverableStatus);
router.delete('/:id', deleteDeliverable);
export default router;

