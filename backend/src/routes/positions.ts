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

router.get('/', authorize(UserRole.admin, UserRole.hr_manager), getPositions);
router.get(
  '/:id',
  authorize(UserRole.admin, UserRole.hr_manager),
  getPositionById,
);
router.post('/', authorize(UserRole.admin), createPosition);
router.patch('/:id', authorize(UserRole.admin), updatePosition);
router.patch(
  '/:id/assign',
  authorize(UserRole.admin),
  assignPositionToEmployee,
);
router.delete('/:id', authorize(UserRole.admin), deletePosition);

export default router;
