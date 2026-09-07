import { Router } from 'express';
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent, getUpcomingEvents, getCalendarEvents, createAssignment, deleteAssignment } from '../controllers/event.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createEventSchema, updateEventSchema, createAssignmentSchema } from '../validators/event.validator';

const router = Router();
router.use(authenticate);
router.get('/', getEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/calendar', getCalendarEvents);
router.get('/:id', getEvent);
router.post('/', validate(createEventSchema), createEvent);
router.put('/:id', validate(updateEventSchema), updateEvent);
router.delete('/:id', deleteEvent);
router.post('/:id/assignments', validate(createAssignmentSchema), createAssignment);
router.delete('/:id/assignments/:assignmentId', deleteAssignment);
export default router;
