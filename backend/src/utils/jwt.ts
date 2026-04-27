import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

const getAccessSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET or JWT_SECRET is required');
  }

  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET or JWT_SECRET is required');
  }

  return secret;
};

export const generateAccessToken = (payload: object): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRE ||
      '15m') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, getAccessSecret(), options);
};

export const generateRefreshToken = (payload: object): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRE ||
      '7d') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, getRefreshSecret(), options);
};

export const verifyAccessToken = (token: string): string | JwtPayload =>
  jwt.verify(token, getAccessSecret());

export const verifyRefreshToken = (token: string): string | JwtPayload =>
  jwt.verify(token, getRefreshSecret());

export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;
