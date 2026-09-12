import { Router } from 'express';
import {
  getGarmentRequirements,
  createGarmentRequirement,
  updateGarmentRequirement,
  deleteGarmentRequirement,
  bulkUpsertGarmentRequirements,
  getProjectModels,
  createProjectModel,
  updateProjectModel,
  deleteProjectModel,
} from '../controllers/fashion.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── Garment Requirements ─────────────────────────────
router.get('/garment-requirements', getGarmentRequirements);
router.post('/garment-requirements', createGarmentRequirement);
router.put('/garment-requirements/:id', updateGarmentRequirement);
router.delete('/garment-requirements/:id', deleteGarmentRequirement);
router.post('/garment-requirements/project/:projectId/bulk', bulkUpsertGarmentRequirements);

// ─── Project Model Assignments ────────────────────────
router.get('/project-models', getProjectModels);
router.post('/project-models', createProjectModel);
router.put('/project-models/:id', updateProjectModel);
router.delete('/project-models/:id', deleteProjectModel);

export default router;
