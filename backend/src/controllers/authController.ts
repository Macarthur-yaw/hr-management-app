import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { verifyRefreshToken } from '../utils/jwt';
import { hashRefreshToken, issueAuthTokens } from '../services/tokenService';
import logger from '../config/logger';
import { EmploymentStatus, UserRole } from '../types';

class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const isUniqueConstraintError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
};

const getRefreshTokenUserId = (refreshToken: string): string => {
  const decoded = verifyRefreshToken(refreshToken);

  if (typeof decoded === 'string' || typeof decoded.id !== 'string') {
    throw new HttpError(401, 'Invalid refresh token');
  }

  return decoded.id;
};

const userSelect = {
  id: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  employee: {
    include: {
      department: true,
      position: true,
    },
  },
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      profileImage,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        message: 'Please provide firstName, lastName, email, and password',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizeEmail(email),
        password: hashedPassword,
        role: UserRole.employee,
        isActive: false,
        employee: {
          create: {
            firstName,
            lastName,
            phone,
            address,
            employmentStatus: EmploymentStatus.inactive,
            profileImage,
            isActive: false,
          },
        },
      },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });

    if (!user.employee) {
      throw new Error('Employee profile was not created');
    }

    res.status(201).json({
      message:
        'Registration submitted. An admin or HR manager must approve this account before login.',
      requiresApproval: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      employee: user.employee,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    logger.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (!user.isActive) {
      const isPendingApproval =
        user.employee?.employmentStatus === EmploymentStatus.inactive &&
        user.employee?.isActive === false;

      res.status(403).json({
        message: isPendingApproval
          ? 'Your account is pending approval'
          : 'This account has been deactivated',
      });
      return;
    }

    const tokens = await issueAuthTokens(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        employee: user.employee,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: 'Please provide refreshToken' });
      return;
    }

    const userId = getRefreshTokenUserId(refreshToken);
    const tokenHash = hashRefreshToken(refreshToken);

    const result = await prisma.$transaction(async (tx) => {
      const storedToken = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: {
          user: {
            include: {
              employee: {
                include: {
                  department: true,
                  position: true,
                },
              },
            },
          },
        },
      });

      if (
        !storedToken ||
        storedToken.userId !== userId ||
        storedToken.revokedAt ||
        storedToken.expiresAt <= new Date()
      ) {
        throw new HttpError(401, 'Invalid refresh token');
      }

      if (!storedToken.user.isActive) {
        const isPendingApproval =
          storedToken.user.employee?.employmentStatus ===
            EmploymentStatus.inactive &&
          storedToken.user.employee?.isActive === false;

        throw new HttpError(
          403,
          isPendingApproval
            ? 'Your account is pending approval'
            : 'This account has been deactivated',
        );
      }

      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      const tokens = await issueAuthTokens(storedToken.userId, tx);

      return {
        user: storedToken.user,
        tokens,
      };
    });

    res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        isActive: result.user.isActive,
        employee: result.user.employee,
        createdAt: result.user.createdAt,
        updatedAt: result.user.updatedAt,
      },
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    logger.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: 'Please provide refreshToken' });
      return;
    }

    await prisma.refreshToken.updateMany({
      where: {
        tokenHash: hashRefreshToken(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: userSelect,
    });

    res.json({ user });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
