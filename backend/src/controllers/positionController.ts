import { Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { AccessLevel } from '../generated/prisma/client';
import { getRouteParam, isPrismaError, sendServerError } from '../utils/api';

const positionInclude = {
  department: true,
  employees: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  },
};

const parseAccessLevel = (accessLevel: unknown): AccessLevel | undefined => {
  return Object.values(AccessLevel).includes(accessLevel as AccessLevel)
    ? (accessLevel as AccessLevel)
    : undefined;
};

const accessLevelPermissions: Record<AccessLevel, string[]> = {
  [AccessLevel.basic]: [
    'profile:read:self',
    'leave:request',
    'leave:read:self',
  ],
  [AccessLevel.manager]: [
    'employees:read',
    'employees:manage',
    'leave:read:all',
    'leave:review',
  ],
  [AccessLevel.admin]: [
    'employees:read',
    'employees:manage',
    'departments:manage',
    'positions:manage',
    'leave:read:all',
    'leave:review',
  ],
};

const permissionsForAccessLevel = (accessLevel: AccessLevel): string[] => {
  return accessLevelPermissions[accessLevel];
};

export const createPosition = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { title, description, departmentId, accessLevel } = req.body;

    if (!title) {
      res.status(400).json({ message: 'Please provide position title' });
      return;
    }

    const parsedAccessLevel =
      parseAccessLevel(accessLevel) || AccessLevel.basic;
    const position = await prisma.position.create({
      data: {
        title,
        description,
        department: departmentId
          ? { connect: { id: departmentId } }
          : undefined,
        permissions: permissionsForAccessLevel(parsedAccessLevel),
        accessLevel: parsedAccessLevel,
      },
      include: positionInclude,
    });

    res.status(201).json({ position });
  } catch (error) {
    if (isPrismaError(error, 'P2003')) {
      res.status(400).json({ message: 'Invalid department' });
      return;
    }

    logger.error('Create position error:', error);
    sendServerError(res);
  }
};

export const getPositions = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const positions = await prisma.position.findMany({
      include: {
        department: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ positions });
  } catch (error) {
    logger.error('Get positions error:', error);
    sendServerError(res);
  }
};

export const getPositionById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getRouteParam(req.params.id);
    const position = await prisma.position.findUnique({
      where: { id },
      include: positionInclude,
    });

    if (!position) {
      res.status(404).json({ message: 'Position not found' });
      return;
    }

    res.json({ position });
  } catch (error) {
    logger.error('Get position error:', error);
    sendServerError(res);
  }
};

export const updatePosition = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getRouteParam(req.params.id);
    const { title, description, departmentId, accessLevel } = req.body;
    const parsedAccessLevel = parseAccessLevel(accessLevel);
    const data = {
      title,
      description,
      department: departmentId
        ? { connect: { id: departmentId } }
        : departmentId === null || departmentId === ''
          ? { disconnect: true }
          : undefined,
      permissions: parsedAccessLevel
        ? permissionsForAccessLevel(parsedAccessLevel)
        : undefined,
      accessLevel: parsedAccessLevel,
    };

    const position = await prisma.position.update({
      where: { id },
      data,
      include: positionInclude,
    });

    res.json({ position });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      res.status(404).json({ message: 'Position not found' });
      return;
    }

    if (isPrismaError(error, 'P2003')) {
      res.status(400).json({ message: 'Invalid department' });
      return;
    }

    logger.error('Update position error:', error);
    sendServerError(res);
  }
};

export const deletePosition = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await prisma.position.delete({
      where: { id: getRouteParam(req.params.id) },
    });

    res.json({ message: 'Position deleted successfully' });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      res.status(404).json({ message: 'Position not found' });
      return;
    }

    logger.error('Delete position error:', error);
    sendServerError(res);
  }
};

export const assignPositionToEmployee = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getRouteParam(req.params.id);
    const { employeeId } = req.body;

    if (!employeeId) {
      res.status(400).json({ message: 'Please provide employeeId' });
      return;
    }

    const position = await prisma.position.findUnique({
      where: { id },
    });

    if (!position) {
      res.status(404).json({ message: 'Position not found' });
      return;
    }

    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: { position: { connect: { id } } },
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
    });

    res.json({ employee });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    logger.error('Assign position error:', error);
    sendServerError(res);
  }
};
