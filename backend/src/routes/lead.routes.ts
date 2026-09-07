import { Router } from 'express';
import { getLeads, getLead, createLead, updateLead, updateLeadStatus, deleteLead } from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createLeadSchema, updateLeadSchema, updateLeadStatusSchema } from '../validators/lead.validator';

const router = Router();
router.use(authenticate);
router.get('/', getLeads);
router.get('/:id', getLead);
router.post('/', validate(createLeadSchema), createLead);
router.put('/:id', validate(updateLeadSchema), updateLead);
router.patch('/:id/status', validate(updateLeadStatusSchema), updateLeadStatus);
router.delete('/:id', deleteLead);
export default router;
