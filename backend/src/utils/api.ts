import { Response } from 'express';

export const isPrismaError = (error: unknown, code: string): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
};

export const sendServerError = (res: Response): void => {
  res.status(500).json({ message: 'Server error' });
};

export const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === 'true' || value === true) {
    return true;
  }

  if (value === 'false' || value === false) {
    return false;
  }

  return undefined;
};

export const getRouteParam = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};
