import { Router } from 'express';
import { getRevenueReport, getCustomerReport, getLeadReport, getEventReport, getPackageReport, getPaymentReport, getTeamReport } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/revenue', getRevenueReport);
router.get('/customers', getCustomerReport);
router.get('/leads', getLeadReport);
router.get('/events', getEventReport);
router.get('/packages', getPackageReport);
router.get('/payments', getPaymentReport);
router.get('/team', getTeamReport);
export default router;
