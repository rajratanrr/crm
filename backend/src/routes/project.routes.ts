import { Router } from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectFinancialSummary,
} from '../controllers/project.controller';
import {
  getProjectModels,
  createProjectModel,
  updateProjectModel,
  deleteProjectModel,
  getGarmentRequirements,
  createGarmentRequirement,
  updateGarmentRequirement,
  deleteGarmentRequirement,
  bulkUpsertGarmentRequirements,
} from '../controllers/fashion.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── Project CRUD ─────────────────────────────────────
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

// ─── Project financial summary ─────────────────────────
router.get('/:id/financial-summary', getProjectFinancialSummary);

// ─── Project model assignments ────────────────────────
router.get('/:projectId/models', getProjectModels);
router.post('/:projectId/models', createProjectModel);
router.patch('/:projectId/models/:id', updateProjectModel);
router.delete('/:projectId/models/:id', deleteProjectModel);

// ─── Project garment requirements ─────────────────────
router.get('/:projectId/garments', getGarmentRequirements);
router.post('/:projectId/garments', createGarmentRequirement);
router.post('/:projectId/garments/bulk', bulkUpsertGarmentRequirements);
router.patch('/:projectId/garments/:id', updateGarmentRequirement);
router.delete('/:projectId/garments/:id', deleteGarmentRequirement);

export default router;
