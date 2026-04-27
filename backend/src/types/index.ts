import type { Employee, User } from '../generated/prisma/client';

export {
  AccessLevel,
  EmploymentStatus,
  LeaveStatus,
  UserRole,
} from '../generated/prisma/client';

export type AuthenticatedUser = Pick<
  User,
  'id' | 'email' | 'role' | 'isActive'
> & {
  employee: Pick<Employee, 'id' | 'isActive' | 'employmentStatus'> | null;
};
