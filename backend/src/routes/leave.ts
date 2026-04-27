import express from 'express';
import {
  getLeaveRequestById,
  getLeaveRequests,
  getMyLeaveRequests,
  requestLeave,
  reviewLeaveRequest,
} from '../controllers/leaveController';
import { authorize, protect } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

router.use(protect);

router.post('/', requestLeave);
router.get('/me', getMyLeaveRequests);
router.get(
  '/',
  authorize(UserRole.admin, UserRole.hr_manager),
  getLeaveRequests,
);
router.get('/:id', getLeaveRequestById);
router.patch(
  '/:id/review',
  authorize(UserRole.admin, UserRole.hr_manager),
  reviewLeaveRequest,
);

export default router;
