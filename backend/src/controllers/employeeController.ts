import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import logger from '../config/logger';
import {
  notifyAccountDeactivated,
  notifyEmployeeCreated,
  notifyPasswordChanged,
} from '../services/notificationService';
import { EmploymentStatus, Prisma, UserRole } from '../generated/prisma/client';
import {
  getRouteParam,
  isPrismaError,
  parseBoolean,
  sendServerError,
} from '../utils/api';

const employeeInclude = {
  user: {
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  department: true,
  position: true,
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const generateTemporaryPassword = (): string => {
  const randomPart = Math.random().toString(36).slice(2, 10);
  const numberPart = Math.floor(1000 + Math.random() * 9000);
  return `HQ-${randomPart}-${numberPart}!`;
};

const parseRole = (role: unknown): UserRole | undefined => {
  return Object.values(UserRole).includes(role as UserRole)
    ? (role as UserRole)
    : undefined;
};

const parseEmploymentStatus = (
  status: unknown,
): EmploymentStatus | undefined => {
  return Object.values(EmploymentStatus).includes(status as EmploymentStatus)
    ? (status as EmploymentStatus)
    : undefined;
};

const canManageTarget = (
  requesterRole: UserRole,
  targetRole: UserRole,
): boolean => {
  return requesterRole === UserRole.admin || targetRole === UserRole.employee;
};

export const createEmployee = async (
  req: Request,
  res: Response,
): Promise<void> => {
  let createdUserId: string | undefined;

  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      role,
      departmentId,
      positionId,
      salary,
      employmentStatus,
      dateJoined,
      profileImage,
    } = req.body;

    if (!firstName || !lastName || !email) {
      res.status(400).json({
        message: 'Please provide firstName, lastName, and email',
      });
      return;
    }

    const requestedRole = parseRole(role) || UserRole.employee;
    if (
      req.user?.role === UserRole.hr_manager &&
      requestedRole !== UserRole.employee
    ) {
      res
        .status(403)
        .json({ message: 'HR managers can only create employees' });
      return;
    }

    const requestedStatus =
      parseEmploymentStatus(employmentStatus) || EmploymentStatus.active;
    const temporaryPassword =
      typeof password === 'string' && password.trim()
        ? password
        : generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        phone,
        address,
        department: departmentId
          ? { connect: { id: departmentId } }
          : undefined,
        position: positionId ? { connect: { id: positionId } } : undefined,
        salary,
        employmentStatus: requestedStatus,
        dateJoined: dateJoined ? new Date(dateJoined) : undefined,
        profileImage,
        user: {
          create: {
            email: normalizeEmail(email),
            password: hashedPassword,
            role: requestedRole,
          },
        },
      },
      include: employeeInclude,
    });
    createdUserId = employee.user.id;

    await notifyEmployeeCreated({
      to: employee.user.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.user.role,
      temporaryPassword,
    });

    res.status(201).json({ employee });
  } catch (error) {
    if (createdUserId) {
      try {
        await prisma.user.delete({ where: { id: createdUserId } });
      } catch (cleanupError) {
        logger.error(
          'Could not clean up employee account after email failure:',
          cleanupError,
        );
      }

      logger.error('Employee credential email failed:', error);
      res.status(502).json({
        message:
          'Employee account could not be created because the login email failed to send',
      });
      return;
    }

    if (isPrismaError(error, 'P2002')) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    if (isPrismaError(error, 'P2003')) {
      res.status(400).json({ message: 'Invalid department or position' });
      return;
    }

    logger.error('Create employee error:', error);
    sendServerError(res);
  }
};

export const getEmployees = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      search,
      departmentId,
      positionId,
      employmentStatus,
      isActive,
      page = '1',
      limit = '20',
    } = req.query;

    const where: Prisma.EmployeeWhereInput = {};
    const normalizedSearch =
      typeof search === 'string' ? search.trim() : undefined;

    if (normalizedSearch) {
      where.OR = [
        { firstName: { contains: normalizedSearch, mode: 'insensitive' } },
        { lastName: { contains: normalizedSearch, mode: 'insensitive' } },
        { phone: { contains: normalizedSearch, mode: 'insensitive' } },
        { address: { contains: normalizedSearch, mode: 'insensitive' } },
        {
          user: {
            email: { contains: normalizedSearch, mode: 'insensitive' },
          },
        },
      ];
    }

    if (typeof departmentId === 'string') {
      where.departmentId = departmentId;
    }

    if (typeof positionId === 'string') {
      where.positionId = positionId;
    }

    const parsedStatus = parseEmploymentStatus(employmentStatus);
    if (parsedStatus) {
      where.employmentStatus = parsedStatus;
    }

    const parsedIsActive = parseBoolean(isActive);
    if (parsedIsActive !== undefined) {
      where.isActive = parsedIsActive;
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const [employees, total] = await prisma.$transaction([
      prisma.employee.findMany({
        where,
        include: employeeInclude,
        orderBy: { createdAt: 'desc' },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({
      employees,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error('Get employees error:', error);
    sendServerError(res);
  }
};

export const getMyEmployeeProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.employee) {
      res.status(404).json({ message: 'Employee profile not found' });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: req.user.employee.id },
      include: employeeInclude,
    });

    res.json({ employee });
  } catch (error) {
    logger.error('Get my employee profile error:', error);
    sendServerError(res);
  }
};

export const getEmployeeById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getRouteParam(req.params.id);

    if (req.user?.role === UserRole.employee && req.user.employee?.id !== id) {
      res
        .status(403)
        .json({ message: 'Employees can only view their own profile' });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: employeeInclude,
    });

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.json({ employee });
  } catch (error) {
    logger.error('Get employee error:', error);
    sendServerError(res);
  }
};

export const updateEmployee = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getRouteParam(req.params.id);
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: existingEmployee.userId },
    });

    if (!existingUser) {
      res.status(404).json({ message: 'Employee user account not found' });
      return;
    }

    if (!canManageTarget(req.user?.role as UserRole, existingUser.role)) {
      res
        .status(403)
        .json({ message: 'HR managers can only manage employees' });
      return;
    }

    const parsedRole = parseRole(req.body.role);
    if (
      req.user?.role === UserRole.hr_manager &&
      parsedRole &&
      parsedRole !== UserRole.employee
    ) {
      res
        .status(403)
        .json({ message: 'HR managers cannot assign elevated roles' });
      return;
    }

    const parsedStatus = parseEmploymentStatus(req.body.employmentStatus);
    const parsedIsActive = parseBoolean(req.body.isActive);
    const passwordChanged = req.body.password !== undefined;
    const userData: Prisma.UserUpdateInput = {};
    const employeeData: Prisma.EmployeeUpdateInput = {};

    if (req.body.email !== undefined) {
      userData.email = normalizeEmail(req.body.email);
    }

    if (req.body.password !== undefined) {
      userData.password = await bcrypt.hash(req.body.password, 10);
    }

    if (parsedRole) {
      userData.role = parsedRole;
    }

    if (parsedIsActive !== undefined) {
      userData.isActive = parsedIsActive;
      employeeData.isActive = parsedIsActive;

      if (!parsedIsActive) {
        employeeData.employmentStatus = EmploymentStatus.terminated;
      }
    }

    if (req.body.firstName !== undefined) {
      employeeData.firstName = req.body.firstName;
    }

    if (req.body.lastName !== undefined) {
      employeeData.lastName = req.body.lastName;
    }

    if (req.body.phone !== undefined) {
      employeeData.phone = req.body.phone;
    }

    if (req.body.address !== undefined) {
      employeeData.address = req.body.address;
    }

    if (req.body.departmentId !== undefined) {
      employeeData.department = req.body.departmentId
        ? { connect: { id: req.body.departmentId } }
        : { disconnect: true };
    }

    if (req.body.positionId !== undefined) {
      employeeData.position = req.body.positionId
        ? { connect: { id: req.body.positionId } }
        : { disconnect: true };
    }

    if (req.body.salary !== undefined) {
      employeeData.salary = req.body.salary;
    }

    if (parsedStatus) {
      employeeData.employmentStatus = parsedStatus;
    }

    if (req.body.dateJoined !== undefined) {
      employeeData.dateJoined = new Date(req.body.dateJoined);
    }

    if (req.body.profileImage !== undefined) {
      employeeData.profileImage = req.body.profileImage;
    }

    const employee = await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: existingEmployee.userId },
          data: userData,
        });
      }

      return tx.employee.update({
        where: { id },
        data: employeeData,
        include: employeeInclude,
      });
    });

    if (passwordChanged) {
      await notifyPasswordChanged({
        to: employee.user.email,
        firstName: employee.firstName,
      });
    }

    if (parsedIsActive === false) {
      await notifyAccountDeactivated({
        to: employee.user.email,
        firstName: employee.firstName,
      });
    }

    res.json({ employee });
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    if (isPrismaError(error, 'P2025') || isPrismaError(error, 'P2003')) {
      res.status(400).json({ message: 'Invalid department or position' });
      return;
    }

    logger.error('Update employee error:', error);
    sendServerError(res);
  }
};

export const deleteEmployee = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getRouteParam(req.params.id);
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: employee.userId },
    });

    if (!user) {
      res.status(404).json({ message: 'Employee user account not found' });
      return;
    }

    if (!canManageTarget(req.user?.role as UserRole, user.role)) {
      res
        .status(403)
        .json({ message: 'HR managers can only deactivate employees' });
      return;
    }

    const updatedEmployee = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: employee.userId },
        data: { isActive: false },
      });

      return tx.employee.update({
        where: { id },
        data: {
          isActive: false,
          employmentStatus: EmploymentStatus.terminated,
        },
        include: employeeInclude,
      });
    });

    await notifyAccountDeactivated({
      to: updatedEmployee.user.email,
      firstName: updatedEmployee.firstName,
    });

    res.json({
      message: 'Employee deactivated successfully',
      employee: updatedEmployee,
    });
  } catch (error) {
    logger.error('Delete employee error:', error);
    sendServerError(res);
  }
};
