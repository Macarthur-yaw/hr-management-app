import { Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { getRouteParam, isPrismaError, sendServerError } from '../utils/api';
import { Prisma } from '../generated/prisma/client';

const departmentInclude = {
  manager: {
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
      position: true,
    },
  },
  positions: true,
};

export const createDepartment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, description, managerId } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Please provide department name' });
      return;
    }

    const department = await prisma.department.create({
      data: {
        name,
        description,
        manager: managerId ? { connect: { id: managerId } } : undefined,
      },
      include: departmentInclude,
    });

    res.status(201).json({ department });
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      res.status(400).json({ message: 'Department name already exists' });
      return;
    }

    if (isPrismaError(error, 'P2003')) {
      res.status(400).json({ message: 'Invalid manager' });
      return;
    }

    logger.error('Create department error:', error);
    sendServerError(res);
  }
};

export const getDepartments = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        manager: {
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
        _count: {
          select: {
            employees: true,
            positions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ departments });
  } catch (error) {
    logger.error('Get departments error:', error);
    sendServerError(res);
  }
};

export const getDepartmentById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getRouteParam(req.params.id);
    const department = await prisma.department.findUnique({
      where: { id },
      include: departmentInclude,
    });

    if (!department) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }

    res.json({ department });
  } catch (error) {
    logger.error('Get department error:', error);
    sendServerError(res);
  }
};

export const updateDepartment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getRouteParam(req.params.id);
    const { name, description, managerId } = req.body;
    const data: Prisma.DepartmentUpdateInput = {
      name,
      description,
    };

    if (managerId !== undefined) {
      data.manager = managerId
        ? { connect: { id: managerId } }
        : { disconnect: true };
    }

    const department = await prisma.department.update({
      where: { id },
      data,
      include: departmentInclude,
    });

    res.json({ department });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }

    if (isPrismaError(error, 'P2002')) {
      res.status(400).json({ message: 'Department name already exists' });
      return;
    }

    if (isPrismaError(error, 'P2003')) {
      res.status(400).json({ message: 'Invalid manager' });
      return;
    }

    logger.error('Update department error:', error);
    sendServerError(res);
  }
};

export const deleteDepartment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await prisma.department.delete({
      where: { id: getRouteParam(req.params.id) },
    });

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }

    logger.error('Delete department error:', error);
    sendServerError(res);
  }
};

export const assignDepartmentManager = async (
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

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee || !employee.isActive) {
      res.status(404).json({ message: 'Active employee not found' });
      return;
    }

    const department = await prisma.department.update({
      where: { id },
      data: { manager: { connect: { id: employeeId } } },
      include: departmentInclude,
    });

    res.json({ department });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }

    logger.error('Assign department manager error:', error);
    sendServerError(res);
  }
};
