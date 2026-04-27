import logger from '../config/logger';
import { LeaveStatus, UserRole } from '../generated/prisma/client';
import { EMAIL_TEMPLATES } from '../templates/emailTemplates';
import { sendTemplateEmail } from './emailService';

type DateValue = Date | string;

const frontendUrl = (): string =>
  (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const loginUrl = (): string => `${frontendUrl()}/login`;

const leaveStatusUrl = (leaveRequestId: string): string =>
  `${frontendUrl()}/leave/${leaveRequestId}`;

const roleLabel = (role: UserRole): string => role.replace(/_/g, ' ');

const sendBestEffort = async (
  description: string,
  callback: () => Promise<void>,
): Promise<void> => {
  try {
    await callback();
  } catch (error) {
    logger.error(`${description} email notification failed:`, error);
  }
};

export const notifyEmployeeCreated = async ({
  to,
  firstName,
  lastName,
  role,
}: {
  to: string;
  firstName: string;
  lastName?: string;
  role: UserRole;
}): Promise<void> => {
  await sendBestEffort('Employee created', () =>
    sendTemplateEmail({
      to,
      template: EMAIL_TEMPLATES.EMPLOYEE_CREATED,
      payload: {
        firstName,
        lastName,
        role: roleLabel(role),
        loginUrl: loginUrl(),
      },
    }),
  );
};

export const notifyPasswordChanged = async ({
  to,
  firstName,
}: {
  to: string;
  firstName?: string;
}): Promise<void> => {
  await sendBestEffort('Password changed', () =>
    sendTemplateEmail({
      to,
      template: EMAIL_TEMPLATES.PASSWORD_CHANGED,
      payload: {
        firstName,
        changedAt: new Date(),
        supportEmail: process.env.EMAIL_USER,
      },
    }),
  );
};

export const notifyAccountDeactivated = async ({
  to,
  firstName,
}: {
  to: string;
  firstName?: string;
}): Promise<void> => {
  await sendBestEffort('Account deactivated', () =>
    sendTemplateEmail({
      to,
      template: EMAIL_TEMPLATES.ACCOUNT_DEACTIVATED,
      payload: {
        firstName,
        supportEmail: process.env.EMAIL_USER,
      },
    }),
  );
};

export const notifyLeaveRequested = async ({
  leaveRequestId,
  employeeEmail,
  employeeFirstName,
  employeeName,
  reviewerEmails,
  startDate,
  endDate,
  reason,
}: {
  leaveRequestId: string;
  employeeEmail: string;
  employeeFirstName?: string;
  employeeName: string;
  reviewerEmails: string[];
  startDate: DateValue;
  endDate: DateValue;
  reason: string;
}): Promise<void> => {
  const statusUrl = leaveStatusUrl(leaveRequestId);

  await Promise.all([
    sendTemplateEmail({
      to: employeeEmail,
      template: EMAIL_TEMPLATES.LEAVE_REQUESTED,
      payload: {
        firstName: employeeFirstName,
        startDate,
        endDate,
        reason,
        statusUrl,
      },
    }),
    ...reviewerEmails.map((to) =>
      sendTemplateEmail({
        to,
        template: EMAIL_TEMPLATES.LEAVE_REVIEW_NEEDED,
        payload: {
          employeeName,
          startDate,
          endDate,
          reason,
          reviewUrl: statusUrl,
        },
      }),
    ),
  ]);
};

export const notifyLeaveReviewed = async ({
  to,
  firstName,
  status,
  startDate,
  endDate,
  reviewComment,
  leaveRequestId,
}: {
  to: string;
  firstName?: string;
  status: LeaveStatus;
  startDate: DateValue;
  endDate: DateValue;
  reviewComment?: string | null;
  leaveRequestId: string;
}): Promise<void> => {
  const template =
    status === LeaveStatus.approved
      ? EMAIL_TEMPLATES.LEAVE_APPROVED
      : EMAIL_TEMPLATES.LEAVE_REJECTED;

  await sendTemplateEmail({
    to,
    template,
    payload: {
      firstName,
      startDate,
      endDate,
      reviewComment: reviewComment || undefined,
      statusUrl: leaveStatusUrl(leaveRequestId),
    },
  });
};
