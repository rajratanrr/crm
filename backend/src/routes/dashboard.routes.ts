import { Router } from 'express';
import { getStats, getRevenue, getUpcomingEvents, getRecentCustomers, getPaymentAlerts, getPendingTasks } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/stats', getStats);
router.get('/revenue', getRevenue);
router.get('/upcoming-events', getUpcomingEvents);
router.get('/recent-customers', getRecentCustomers);
router.get('/payment-alerts', getPaymentAlerts);
router.get('/tasks', getPendingTasks);
export default router;
