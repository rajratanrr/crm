import { Router } from 'express';
import { getAttendance, markAttendance, deleteAttendance } from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getAttendance);
router.post('/', markAttendance);
router.delete('/:id', deleteAttendance);

export default router;
