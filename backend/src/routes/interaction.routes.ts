import { Router } from 'express';
import { getInteractions, createInteraction, deleteInteraction } from '../controllers/interaction.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createInteractionSchema } from '../validators/interaction.validator';

const router = Router();
router.use(authenticate);
router.get('/customers/:customerId/interactions', getInteractions);
router.post('/customers/:customerId/interactions', validate(createInteractionSchema), createInteraction);
router.delete('/interactions/:id', deleteInteraction);
export default router;
