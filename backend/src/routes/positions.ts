import express from 'express';
import {
  assignPositionToEmployee,
  createPosition,
  deletePosition,
  getPositionById,
  getPositions,
  updatePosition,
} from '../controllers/positionController';
import { authorize, protect } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

router.use(protect);

router.get('/', getPositions);
router.get('/:id', getPositionById);
router.post(
  '/',
  authorize(UserRole.admin, UserRole.hr_manager),
  createPosition,
);
router.patch(
  '/:id',
  authorize(UserRole.admin, UserRole.hr_manager),
  updatePosition,
);
router.patch(
  '/:id/assign',
  authorize(UserRole.admin, UserRole.hr_manager),
  assignPositionToEmployee,
);
router.delete(
  '/:id',
  authorize(UserRole.admin, UserRole.hr_manager),
  deletePosition,
);

export default router;
