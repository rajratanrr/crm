import { Router } from 'express';
import { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee } from '../controllers/employee.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employee.validator';

const router = Router();
router.use(authenticate);
router.get('/', getEmployees);
router.get('/:id', getEmployee);
router.post('/', validate(createEmployeeSchema), createEmployee);
router.put('/:id', validate(updateEmployeeSchema), updateEmployee);
router.delete('/:id', deleteEmployee);
export default router;
