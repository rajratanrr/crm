import { Router } from 'express';
import { getPackages, getPackage, createPackage, updatePackage, deletePackage } from '../controllers/package.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPackageSchema, updatePackageSchema } from '../validators/package.validator';

const router = Router();
router.use(authenticate);
router.get('/', getPackages);
router.get('/:id', getPackage);
router.post('/', validate(createPackageSchema), createPackage);
router.put('/:id', validate(updatePackageSchema), updatePackage);
router.delete('/:id', deletePackage);
export default router;
