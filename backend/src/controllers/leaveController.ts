import { Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { LeaveStatus, Prisma, UserRole } from '../generated/prisma/client';
import {
  notifyLeaveRequested,
  notifyLeaveReviewed,
} from '../services/notificationService';
import { getRouteParam, sendServerError } from '../utils/api';

class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

const leaveInclude = {
  employee: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
      department: true,
      position: true,
    },
  },
  reviewedBy: {
    select: {
      id: true,
      email: true,
      role: true,
    },
  },
};

const parseDate = (value: unknown): Date | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseReviewStatus = (status: unknown): LeaveStatus | null => {
  if (status === LeaveStatus.approved || status === LeaveStatus.rejected) {
    return status;
  }

  return null;
};

const handleLeaveError = (
  error: unknown,
  res: Response,
  logMessage: string,
): void => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  logger.error(logMessage, error);
  sendServerError(res);
};

export const requestLeave = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.employee) {
      res.status(403).json({ message: 'Only employees can request leave' });
      return;
    }

    const { startDate, endDate, reason } = req.body;
    const parsedStartDate = parseDate(startDate);
    const parsedEndDate = parseDate(endDate);

    if (!parsedStartDate || !parsedEndDate || !reason) {
      res.status(400).json({
        message: 'Please provide valid startDate, endDate, and reason',
      });
      return;
    }

    if (parsedStartDate > parsedEndDate) {
      res.status(400).json({ message: 'startDate must be before endDate' });
      return;
    }

    const leaveRequest = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findUnique({
        where: { id: req.user?.employee?.id },
      });

      if (!employee || !employee.isActive) {
        throw new HttpError(403, 'Active employee profile not found');
      }

      const user = await tx.user.findUnique({
        where: { id: employee.userId },
      });

      if (!user || !user.isActive) {
        throw new HttpError(403, 'Active employee user account not found');
      }

      const leave = await tx.leaveRequest.create({
        data: {
          employeeId: employee.id,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          reason,
        },
        include: leaveInclude,
      });

      const reviewers = await tx.user.findMany({
        where: {
          isActive: true,
          role: { in: [UserRole.admin, UserRole.hr_manager] },
        },
        select: { email: true },
      });

      await notifyLeaveRequested({
        leaveRequestId: leave.id,
        employeeEmail: user.email,
        employeeFirstName: employee.firstName,
        employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
        reviewerEmails: reviewers.map((reviewer) => reviewer.email),
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        reason,
      });

      return leave;
    });

    res.status(201).json({ leaveRequest });
  } catch (error) {
    handleLeaveError(error, res, 'Request leave error:');
  }
};

export const getMyLeaveRequests = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.employee) {
      res.status(404).json({ message: 'Employee profile not found' });
      return;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { employeeId: req.user.employee.id },
      include: leaveInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ leaveRequests });
  } catch (error) {
    logger.error('Get my leave requests error:', error);
    sendServerError(res);
  }
};

export const getLeaveRequests = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { status, employeeId } = req.query;
    const where: Prisma.LeaveRequestWhereInput = {};

    if (Object.values(LeaveStatus).includes(status as LeaveStatus)) {
      where.status = status as LeaveStatus;
    }

    if (typeof employeeId === 'string') {
      where.employeeId = employeeId;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: leaveInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ leaveRequests });
  } catch (error) {
    logger.error('Get leave requests error:', error);
    sendServerError(res);
  }
};

export const getLeaveRequestById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getRouteParam(req.params.id);
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: leaveInclude,
    });

    if (!leaveRequest) {
      res.status(404).json({ message: 'Leave request not found' });
      return;
    }

    if (
      req.user?.role === UserRole.employee &&
      leaveRequest.employeeId !== req.user.employee?.id
    ) {
      res
        .status(403)
        .json({ message: 'Employees can only view their own leave' });
      return;
    }

    res.json({ leaveRequest });
  } catch (error) {
    logger.error('Get leave request error:', error);
    sendServerError(res);
  }
};

export const reviewLeaveRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getRouteParam(req.params.id);
    const parsedStatus = parseReviewStatus(req.body.status);

    if (!parsedStatus) {
      res.status(400).json({ message: 'Status must be approved or rejected' });
      return;
    }

    const leaveRequest = await prisma.$transaction(async (tx) => {
      const existingLeave = await tx.leaveRequest.findUnique({
        where: { id },
      });

      if (!existingLeave) {
        throw new HttpError(404, 'Leave request not found');
      }

      if (existingLeave.status !== LeaveStatus.pending) {
        throw new HttpError(400, 'Only pending leave requests can be reviewed');
      }

      const employee = await tx.employee.findUnique({
        where: { id: existingLeave.employeeId },
      });

      if (!employee) {
        throw new HttpError(404, 'Employee profile not found');
      }

      const user = await tx.user.findUnique({
        where: { id: employee.userId },
      });

      if (!user) {
        throw new HttpError(404, 'Employee user account not found');
      }

      const updatedLeave = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: parsedStatus,
          reviewedByUserId: req.user?.id,
          reviewComment: req.body.reviewComment,
        },
        include: leaveInclude,
      });

      await notifyLeaveReviewed({
        to: user.email,
        firstName: employee.firstName,
        status: parsedStatus,
        startDate: existingLeave.startDate,
        endDate: existingLeave.endDate,
        reviewComment: req.body.reviewComment,
        leaveRequestId: existingLeave.id,
      });

      return updatedLeave;
    });

    res.json({ leaveRequest });
  } catch (error) {
    handleLeaveError(error, res, 'Review leave request error:');
  }
};
