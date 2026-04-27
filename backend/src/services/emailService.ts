import nodemailer from 'nodemailer';
import logger from '../config/logger';
import {
  EmailTemplate,
  EmailTemplatePayload,
  renderEmailTemplate,
} from '../templates/emailTemplates';

type EmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type TemplateEmailOptions<T extends EmailTemplate> = {
  to: string;
  template: T;
  payload: EmailTemplatePayload<T>;
};

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

let cachedTransporter: MailTransporter | null = null;

const requireEmailConfig = (): {
  user: string;
  pass: string;
  service: string;
  from: string;
} => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const service = process.env.EMAIL_SERVICE || 'gmail';
  const from = process.env.EMAIL_FROM || user;

  if (!user || !pass || !from) {
    throw new Error(
      'EMAIL_USER, EMAIL_PASS, and EMAIL_FROM/EMAIL_USER are required',
    );
  }

  return { user, pass, service, from };
};

const getTransporter = (): {
  transporter: MailTransporter;
  from: string;
} => {
  const { user, pass, service, from } = requireEmailConfig();

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service,
      auth: {
        user,
        pass,
      },
    });
  }

  return { transporter: cachedTransporter, from };
};

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: EmailOptions): Promise<void> => {
  if (!to) {
    throw new Error('Recipient email is required');
  }

  const { transporter, from } = getTransporter();
  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  logger.info(`Email sent to ${to}: ${subject}`);
};

export const sendTemplateEmail = async <T extends EmailTemplate>({
  to,
  template,
  payload,
}: TemplateEmailOptions<T>): Promise<void> => {
  const renderedEmail = renderEmailTemplate(template, payload);

  await sendEmail({
    to,
    ...renderedEmail,
  });
};
