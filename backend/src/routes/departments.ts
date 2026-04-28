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

router.get('/', authorize(UserRole.admin, UserRole.hr_manager), getDepartments);
router.get(
  '/:id',
  authorize(UserRole.admin, UserRole.hr_manager),
  getDepartmentById,
);
router.post('/', authorize(UserRole.admin), createDepartment);
router.patch('/:id', authorize(UserRole.admin), updateDepartment);
router.patch(
  '/:id/manager',
  authorize(UserRole.admin),
  assignDepartmentManager,
);
router.delete('/:id', authorize(UserRole.admin), deleteDepartment);

export default router;
