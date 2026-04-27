import express from 'express';
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployees,
  getMyEmployeeProfile,
  updateEmployee,
} from '../controllers/employeeController';
import { authorize, protect } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

router.use(protect);

router.get('/me', getMyEmployeeProfile);
router.get('/', authorize(UserRole.admin, UserRole.hr_manager), getEmployees);
router.post(
  '/',
  authorize(UserRole.admin, UserRole.hr_manager),
  createEmployee,
);
router.get('/:id', getEmployeeById);
router.patch(
  '/:id',
  authorize(UserRole.admin, UserRole.hr_manager),
  updateEmployee,
);
router.delete(
  '/:id',
  authorize(UserRole.admin, UserRole.hr_manager),
  deleteEmployee,
);

export default router;
