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
  getClientFinancialSummary,
} from '../controllers/fashion.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── Garment Requirements (query-param style) ─────────
router.get('/garment-requirements', getGarmentRequirements);
router.post('/garment-requirements', createGarmentRequirement);
router.put('/garment-requirements/:id', updateGarmentRequirement);
router.patch('/garment-requirements/:id', updateGarmentRequirement);
router.delete('/garment-requirements/:id', deleteGarmentRequirement);
router.post('/garment-requirements/project/:projectId/bulk', bulkUpsertGarmentRequirements);

// ─── Project Model Assignments (query-param style) ────
router.get('/project-models', getProjectModels);
router.post('/project-models', createProjectModel);
router.put('/project-models/:id', updateProjectModel);
router.patch('/project-models/:id', updateProjectModel);
router.delete('/project-models/:id', deleteProjectModel);

// ─── Client financial summary ─────────────────────────
router.get('/clients/:clientId/financial-summary', getClientFinancialSummary);

export default router;
