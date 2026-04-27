export const EMAIL_TEMPLATES = {
  EMAIL_VERIFICATION: 'email_verification',
  EMPLOYEE_CREATED: 'employee_created',
  PASSWORD_CHANGED: 'password_changed',
  ACCOUNT_DEACTIVATED: 'account_deactivated',
  LEAVE_REQUESTED: 'leave_requested',
  LEAVE_REVIEW_NEEDED: 'leave_review_needed',
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
} as const;

export type EmailTemplate =
  (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];

type BasePersonPayload = {
  firstName?: string;
};

type DateValue = Date | string;

export type EmailTemplatePayloads = {
  [EMAIL_TEMPLATES.EMAIL_VERIFICATION]: BasePersonPayload & {
    verificationUrl: string;
    expiresIn?: string;
  };
  [EMAIL_TEMPLATES.EMPLOYEE_CREATED]: BasePersonPayload & {
    lastName?: string;
    role: string;
    loginUrl: string;
  };
  [EMAIL_TEMPLATES.PASSWORD_CHANGED]: BasePersonPayload & {
    changedAt?: DateValue;
    supportEmail?: string;
  };
  [EMAIL_TEMPLATES.ACCOUNT_DEACTIVATED]: BasePersonPayload & {
    supportEmail?: string;
  };
  [EMAIL_TEMPLATES.LEAVE_REQUESTED]: BasePersonPayload & {
    startDate: DateValue;
    endDate: DateValue;
    reason: string;
    statusUrl?: string;
  };
  [EMAIL_TEMPLATES.LEAVE_REVIEW_NEEDED]: {
    employeeName: string;
    startDate: DateValue;
    endDate: DateValue;
    reason: string;
    reviewUrl?: string;
  };
  [EMAIL_TEMPLATES.LEAVE_APPROVED]: BasePersonPayload & {
    startDate: DateValue;
    endDate: DateValue;
    reviewComment?: string;
    statusUrl?: string;
  };
  [EMAIL_TEMPLATES.LEAVE_REJECTED]: BasePersonPayload & {
    startDate: DateValue;
    endDate: DateValue;
    reviewComment?: string;
    statusUrl?: string;
  };
};

export type EmailTemplatePayload<T extends EmailTemplate> =
  EmailTemplatePayloads[T];

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

const BRAND_NAME = process.env.APP_NAME || 'HR Management System';
const PRIMARY = '#EAF3FB';
const ACCENT = '#0FA3A6';
const BODY_TEXT = '#3c4043';
const MUTED = '#6b7280';
const RULE = '#e8eaed';
const WHITE = '#ffffff';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatDate = (value: DateValue): string => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
};

const greeting = (firstName?: string): string =>
  `Hello${firstName ? ` ${escapeHtml(firstName)}` : ''},`;

const paragraph = (content: string): string =>
  `<p style="font-size:14px;line-height:24px;color:${BODY_TEXT};margin:0 0 12px;">${content}</p>`;

const field = (label: string, value: string): string => `
  <p style="font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${MUTED};margin:12px 0 2px;">${escapeHtml(label)}</p>
  <p style="font-size:14px;font-weight:600;color:${ACCENT};margin:0 0 4px;line-height:22px;">${escapeHtml(value)}</p>
`;

const button = (href: string, label: string): string => `
  <p style="margin:22px 0;">
    <a href="${escapeHtml(href)}" style="background:${ACCENT};border-radius:5px;color:${WHITE};display:inline-block;font-size:14px;font-weight:700;padding:12px 18px;text-decoration:none;">${escapeHtml(label)}</a>
  </p>
`;

const layout = ({
  preview,
  eyebrow,
  body,
}: {
  preview: string;
  eyebrow: string;
  body: string;
}): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(preview)}</title>
  </head>
  <body style="background:#ffffff;font-family:Helvetica,Arial,sans-serif;margin:0;padding:30px 0;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(preview)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:${WHITE};border-radius:5px;max-width:560px;overflow:hidden;width:100%;">
            <tr>
              <td style="background:${PRIMARY};padding:20px 40px;">
                <p style="color:${BODY_TEXT};font-size:18px;font-weight:700;margin:0;">${escapeHtml(BRAND_NAME)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px;">
                <hr style="border:none;border-top:1px solid ${RULE};margin:20px 0;" />
                <p style="font-size:12px;font-weight:700;letter-spacing:1px;color:${ACCENT};margin:0 0 16px;line-height:22px;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
                ${body}
                <hr style="border:none;border-top:1px solid ${RULE};margin:20px 0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 30px;">
                <p style="font-size:11px;line-height:20px;color:${MUTED};text-align:center;margin:0;">© ${new Date().getFullYear()} ${escapeHtml(BRAND_NAME)}. All rights reserved.</p>
                <p style="font-size:11px;line-height:20px;color:${MUTED};text-align:center;margin:0;">This is an automated notification. Please do not reply directly to this message.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const renderEmailVerification = (
  payload: EmailTemplatePayloads[typeof EMAIL_TEMPLATES.EMAIL_VERIFICATION],
): RenderedEmail => {
  const expiresIn = payload.expiresIn || '24 hours';
  const subject = 'Verify your email address';
  const text = `Please verify your email address. This link expires in ${expiresIn}: ${payload.verificationUrl}`;

  return {
    subject,
    text,
    html: layout({
      preview: subject,
      eyebrow: 'Verify Email',
      body:
        paragraph(greeting(payload.firstName)) +
        paragraph(
          `Please verify your email address to finish setting up your ${escapeHtml(BRAND_NAME)} account. This link expires in ${escapeHtml(expiresIn)}.`,
        ) +
        button(payload.verificationUrl, 'Verify email'),
    }),
  };
};

const renderEmployeeCreated = (
  payload: EmailTemplatePayloads[typeof EMAIL_TEMPLATES.EMPLOYEE_CREATED],
): RenderedEmail => {
  const subject = 'Your employee account has been created';
  const role = payload.role.replace(/_/g, ' ');
  const text = `Your ${BRAND_NAME} account has been created. Role: ${role}. Login: ${payload.loginUrl}`;

  return {
    subject,
    text,
    html: layout({
      preview: subject,
      eyebrow: 'Account Created',
      body:
        paragraph(greeting(payload.firstName)) +
        paragraph(
          `Your employee account has been created in ${escapeHtml(BRAND_NAME)}.`,
        ) +
        field('Role', role) +
        paragraph(
          'Use the login link below to access your account. If you do not know your password, contact HR or use the password reset flow when it is available.',
        ) +
        button(payload.loginUrl, 'Open HR system'),
    }),
  };
};

const renderPasswordChanged = (
  payload: EmailTemplatePayloads[typeof EMAIL_TEMPLATES.PASSWORD_CHANGED],
): RenderedEmail => {
  const subject = 'Your password was changed';
  const changedAt = payload.changedAt
    ? formatDate(payload.changedAt)
    : 'just now';
  const supportEmail = payload.supportEmail || process.env.EMAIL_USER || 'HR';
  const text = `Your ${BRAND_NAME} password was changed ${changedAt}. If this was not you, contact ${supportEmail}.`;

  return {
    subject,
    text,
    html: layout({
      preview: subject,
      eyebrow: 'Password Changed',
      body:
        paragraph(greeting(payload.firstName)) +
        paragraph(
          `Your ${escapeHtml(BRAND_NAME)} password was changed ${escapeHtml(changedAt)}.`,
        ) +
        paragraph(
          `If you did not request this change, contact ${escapeHtml(supportEmail)} immediately.`,
        ),
    }),
  };
};

const renderAccountDeactivated = (
  payload: EmailTemplatePayloads[typeof EMAIL_TEMPLATES.ACCOUNT_DEACTIVATED],
): RenderedEmail => {
  const subject = 'Your employee account has been deactivated';
  const supportEmail = payload.supportEmail || process.env.EMAIL_USER || 'HR';
  const text = `Your ${BRAND_NAME} employee account has been deactivated. Contact ${supportEmail} if this is unexpected.`;

  return {
    subject,
    text,
    html: layout({
      preview: subject,
      eyebrow: 'Account Deactivated',
      body:
        paragraph(greeting(payload.firstName)) +
        paragraph(
          `Your ${escapeHtml(BRAND_NAME)} employee account has been deactivated.`,
        ) +
        paragraph(
          `If this is unexpected, contact ${escapeHtml(supportEmail)}.`,
        ),
    }),
  };
};

const renderLeaveRequested = (
  payload: EmailTemplatePayloads[typeof EMAIL_TEMPLATES.LEAVE_REQUESTED],
): RenderedEmail => {
  const start = formatDate(payload.startDate);
  const end = formatDate(payload.endDate);
  const subject = 'Leave request submitted';
  const text = `Your leave request from ${start} to ${end} was submitted. Reason: ${payload.reason}`;

  return {
    subject,
    text,
    html: layout({
      preview: subject,
      eyebrow: 'Leave Requested',
      body:
        paragraph(greeting(payload.firstName)) +
        paragraph('Your leave request has been submitted for review.') +
        field('Start date', start) +
        field('End date', end) +
        field('Reason', payload.reason) +
        (payload.statusUrl ? button(payload.statusUrl, 'View request') : ''),
    }),
  };
};

const renderLeaveReviewNeeded = (
  payload: EmailTemplatePayloads[typeof EMAIL_TEMPLATES.LEAVE_REVIEW_NEEDED],
): RenderedEmail => {
  const start = formatDate(payload.startDate);
  const end = formatDate(payload.endDate);
  const subject = 'New leave request needs review';
  const text = `${payload.employeeName} requested leave from ${start} to ${end}. Reason: ${payload.reason}`;

  return {
    subject,
    text,
    html: layout({
      preview: subject,
      eyebrow: 'Leave Review Needed',
      body:
        paragraph('Hello HR Team,') +
        paragraph('A new leave request has been submitted for review.') +
        field('Employee', payload.employeeName) +
        field('Start date', start) +
        field('End date', end) +
        field('Reason', payload.reason) +
        (payload.reviewUrl ? button(payload.reviewUrl, 'Review request') : ''),
    }),
  };
};

const renderLeaveReviewed = (
  template:
    | typeof EMAIL_TEMPLATES.LEAVE_APPROVED
    | typeof EMAIL_TEMPLATES.LEAVE_REJECTED,
  payload:
    | EmailTemplatePayloads[typeof EMAIL_TEMPLATES.LEAVE_APPROVED]
    | EmailTemplatePayloads[typeof EMAIL_TEMPLATES.LEAVE_REJECTED],
): RenderedEmail => {
  const approved = template === EMAIL_TEMPLATES.LEAVE_APPROVED;
  const status = approved ? 'approved' : 'rejected';
  const start = formatDate(payload.startDate);
  const end = formatDate(payload.endDate);
  const subject = `Leave request ${status}`;
  const text = `Your leave request from ${start} to ${end} was ${status}.${payload.reviewComment ? ` Comment: ${payload.reviewComment}` : ''}`;

  return {
    subject,
    text,
    html: layout({
      preview: subject,
      eyebrow: `Leave ${status}`,
      body:
        paragraph(greeting(payload.firstName)) +
        paragraph(`Your leave request has been ${escapeHtml(status)}.`) +
        field('Start date', start) +
        field('End date', end) +
        (payload.reviewComment
          ? field('Review comment', payload.reviewComment)
          : '') +
        (payload.statusUrl ? button(payload.statusUrl, 'View request') : ''),
    }),
  };
};

export const renderEmailTemplate = <T extends EmailTemplate>(
  template: T,
  payload: EmailTemplatePayload<T>,
): RenderedEmail => {
  switch (template) {
    case EMAIL_TEMPLATES.EMAIL_VERIFICATION:
      return renderEmailVerification(
        payload as EmailTemplatePayloads[typeof EMAIL_TEMPLATES.EMAIL_VERIFICATION],
      );
    case EMAIL_TEMPLATES.EMPLOYEE_CREATED:
      return renderEmployeeCreated(
        payload as EmailTemplatePayloads[typeof EMAIL_TEMPLATES.EMPLOYEE_CREATED],
      );
    case EMAIL_TEMPLATES.PASSWORD_CHANGED:
      return renderPasswordChanged(
        payload as EmailTemplatePayloads[typeof EMAIL_TEMPLATES.PASSWORD_CHANGED],
      );
    case EMAIL_TEMPLATES.ACCOUNT_DEACTIVATED:
      return renderAccountDeactivated(
        payload as EmailTemplatePayloads[typeof EMAIL_TEMPLATES.ACCOUNT_DEACTIVATED],
      );
    case EMAIL_TEMPLATES.LEAVE_REQUESTED:
      return renderLeaveRequested(
        payload as EmailTemplatePayloads[typeof EMAIL_TEMPLATES.LEAVE_REQUESTED],
      );
    case EMAIL_TEMPLATES.LEAVE_REVIEW_NEEDED:
      return renderLeaveReviewNeeded(
        payload as EmailTemplatePayloads[typeof EMAIL_TEMPLATES.LEAVE_REVIEW_NEEDED],
      );
    case EMAIL_TEMPLATES.LEAVE_APPROVED:
    case EMAIL_TEMPLATES.LEAVE_REJECTED:
      return renderLeaveReviewed(
        template,
        payload as
          | EmailTemplatePayloads[typeof EMAIL_TEMPLATES.LEAVE_APPROVED]
          | EmailTemplatePayloads[typeof EMAIL_TEMPLATES.LEAVE_REJECTED],
      );
    default:
      throw new Error(`Unsupported email template: ${String(template)}`);
  }
};
