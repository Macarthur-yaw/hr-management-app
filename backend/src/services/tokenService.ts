import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from '../config/prisma';
import type { PrismaClient } from '../generated/prisma/client';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

type TokenStore = Pick<PrismaClient, 'refreshToken'>;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export const hashRefreshToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const parseDurationMs = (duration: string): number => {
  const match = duration.trim().match(/^(\d+)([smhd])?$/);

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2] || 's';
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
};

const getRefreshTokenExpiry = (token: string): Date => {
  const decoded = jwt.decode(token) as JwtPayload | null;

  if (decoded?.exp) {
    return new Date(decoded.exp * 1000);
  }

  return new Date(
    Date.now() + parseDurationMs(process.env.JWT_REFRESH_EXPIRE || '7d'),
  );
};

export const issueAuthTokens = async (
  userId: string,
  client: TokenStore = prisma,
): Promise<AuthTokens> => {
  const accessToken = generateAccessToken({ id: userId });
  const refreshToken = generateRefreshToken({ id: userId });

  await client.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiry(refreshToken),
    },
  });

  return { accessToken, refreshToken };
};
