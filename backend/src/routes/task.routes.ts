import { Router } from 'express';
import { getTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from '../validators/task.validator';

const router = Router();
router.use(authenticate);
router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', validate(createTaskSchema), createTask);
router.put('/:id', validate(updateTaskSchema), updateTask);
router.patch('/:id/status', validate(updateTaskStatusSchema), updateTaskStatus);
router.delete('/:id', deleteTask);
export default router;
