import express from 'express';
import {
  assignDepartmentManager,
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  getDepartments,
  updateDepartment,
} from '../controllers/departmentController';
import { authorize, protect } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

router.use(protect);

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post(
  '/',
  authorize(UserRole.admin, UserRole.hr_manager),
  createDepartment,
);
router.patch(
  '/:id',
  authorize(UserRole.admin, UserRole.hr_manager),
  updateDepartment,
);
router.patch(
  '/:id/manager',
  authorize(UserRole.admin, UserRole.hr_manager),
  assignDepartmentManager,
);
router.delete(
  '/:id',
  authorize(UserRole.admin, UserRole.hr_manager),
  deleteDepartment,
);

export default router;
