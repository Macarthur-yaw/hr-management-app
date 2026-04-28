const bearerAuth = [{ bearerAuth: [] }];

export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'HR Management System API',
    version: '1.0.0',
    description:
      'Backend API for authentication, employees, departments, positions, and leave management.',
  },
  servers: [
    {
      url: '/api',
      description: 'Current server',
    },
    {
      url: 'http://localhost:5000/api',
      description: 'Local development',
    },
  ],
  tags: [
    { name: 'Auth' },
    { name: 'Employees' },
    { name: 'Departments' },
    { name: 'Positions' },
    { name: 'Leave' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Server error' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: {
            type: 'string',
            enum: ['admin', 'hr_manager', 'employee'],
          },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Employee: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string', nullable: true },
          address: { type: 'string', nullable: true },
          departmentId: { type: 'string', nullable: true },
          positionId: { type: 'string', nullable: true },
          salary: { type: 'number', nullable: true },
          employmentStatus: {
            type: 'string',
            enum: ['active', 'inactive', 'on_leave', 'terminated'],
          },
          dateJoined: { type: 'string', format: 'date-time' },
          profileImage: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          user: { $ref: '#/components/schemas/User' },
          department: { $ref: '#/components/schemas/Department' },
          position: { $ref: '#/components/schemas/Position' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Department: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          managerId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Position: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          departmentId: { type: 'string', nullable: true },
          permissions: {
            type: 'array',
            items: { type: 'string' },
          },
          accessLevel: {
            type: 'string',
            enum: ['basic', 'manager', 'admin'],
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      LeaveRequest: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          employeeId: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          reason: { type: 'string' },
          status: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected'],
          },
          reviewedByUserId: { type: 'string', nullable: true },
          reviewComment: { type: 'string', nullable: true },
          employee: { $ref: '#/components/schemas/Employee' },
          reviewedBy: { $ref: '#/components/schemas/User' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          employee: { $ref: '#/components/schemas/Employee' },
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Doe' },
          email: {
            type: 'string',
            format: 'email',
            example: 'jane@example.com',
          },
          password: { type: 'string', format: 'password', example: 'Pass123!' },
          phone: { type: 'string', example: '+15551234567' },
          address: { type: 'string', example: '123 Market Street' },
          departmentId: { type: 'string' },
          positionId: { type: 'string' },
          salary: { type: 'number', example: 60000 },
          dateJoined: { type: 'string', format: 'date-time' },
          profileImage: { type: 'string' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'admin@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'AdminPass123!',
          },
        },
      },
      EmployeeCreateRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'email'],
        properties: {
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Doe' },
          email: {
            type: 'string',
            format: 'email',
            example: 'jane@example.com',
          },
          phone: { type: 'string', example: '+15551234567' },
          address: { type: 'string', example: '123 Market Street' },
          departmentId: { type: 'string' },
          positionId: { type: 'string' },
          salary: { type: 'number', example: 60000 },
          dateJoined: { type: 'string', format: 'date-time' },
          profileImage: { type: 'string' },
          role: {
            type: 'string',
            enum: ['admin', 'hr_manager', 'employee'],
          },
          employmentStatus: {
            type: 'string',
            enum: ['active', 'inactive', 'on_leave', 'terminated'],
          },
        },
      },
      DepartmentRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Engineering' },
          description: { type: 'string', example: 'Product engineering team' },
          managerId: { type: 'string' },
        },
      },
      PositionRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'Backend Engineer' },
          description: { type: 'string' },
          departmentId: { type: 'string' },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            example: ['employees:read'],
          },
          accessLevel: {
            type: 'string',
            enum: ['basic', 'manager', 'admin'],
          },
        },
      },
      LeaveRequestCreate: {
        type: 'object',
        required: ['startDate', 'endDate', 'reason'],
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          reason: { type: 'string', example: 'Annual vacation' },
        },
      },
      LeaveReviewRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['approved', 'rejected'],
          },
          reviewComment: {
            type: 'string',
            example: 'Approved. Enjoy your time off.',
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      NotFound: {
        description: 'Not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a public employee account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive access and refresh tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Logged in successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token and get a new access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke a refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Logged out successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the authenticated user',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'Authenticated user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/employees': {
      get: {
        tags: ['Employees'],
        summary: 'List employees',
        security: bearerAuth,
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'departmentId', in: 'query', schema: { type: 'string' } },
          { name: 'positionId', in: 'query', schema: { type: 'string' } },
          {
            name: 'employmentStatus',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['active', 'inactive', 'on_leave', 'terminated'],
            },
          },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
        ],
        responses: {
          '200': {
            description: 'Employees list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    employees: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Employee' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Employees'],
        summary: 'Create an employee and user account',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EmployeeCreateRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Employee created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    employee: { $ref: '#/components/schemas/Employee' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/employees/me': {
      get: {
        tags: ['Employees'],
        summary: 'Get my employee profile',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'Employee profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    employee: { $ref: '#/components/schemas/Employee' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/employees/{id}': {
      get: {
        tags: ['Employees'],
        summary: 'Get employee by id',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Employee profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    employee: { $ref: '#/components/schemas/Employee' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Employees'],
        summary: 'Update employee',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EmployeeCreateRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Employee updated' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Employees'],
        summary: 'Soft deactivate employee',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Employee deactivated' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/departments': {
      get: {
        tags: ['Departments'],
        summary: 'List departments',
        security: bearerAuth,
        responses: {
          '200': { description: 'Departments list' },
        },
      },
      post: {
        tags: ['Departments'],
        summary: 'Create department',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DepartmentRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Department created' },
        },
      },
    },
    '/departments/{id}': {
      get: {
        tags: ['Departments'],
        summary: 'Get department by id',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Department found' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Departments'],
        summary: 'Update department',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DepartmentRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Department updated' },
        },
      },
      delete: {
        tags: ['Departments'],
        summary: 'Delete department',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Department deleted' },
        },
      },
    },
    '/departments/{id}/manager': {
      patch: {
        tags: ['Departments'],
        summary: 'Assign department manager',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['employeeId'],
                properties: {
                  employeeId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Manager assigned' },
        },
      },
    },
    '/positions': {
      get: {
        tags: ['Positions'],
        summary: 'List positions',
        security: bearerAuth,
        responses: {
          '200': { description: 'Positions list' },
        },
      },
      post: {
        tags: ['Positions'],
        summary: 'Create position',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PositionRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Position created' },
        },
      },
    },
    '/positions/{id}': {
      get: {
        tags: ['Positions'],
        summary: 'Get position by id',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Position found' },
        },
      },
      patch: {
        tags: ['Positions'],
        summary: 'Update position',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PositionRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Position updated' },
        },
      },
      delete: {
        tags: ['Positions'],
        summary: 'Delete position',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Position deleted' },
        },
      },
    },
    '/positions/{id}/assign': {
      patch: {
        tags: ['Positions'],
        summary: 'Assign position to employee',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['employeeId'],
                properties: {
                  employeeId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Position assigned' },
        },
      },
    },
    '/leave': {
      get: {
        tags: ['Leave'],
        summary: 'List all leave requests',
        security: bearerAuth,
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
            },
          },
          { name: 'employeeId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Leave requests list' },
        },
      },
      post: {
        tags: ['Leave'],
        summary: 'Request leave',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LeaveRequestCreate' },
            },
          },
        },
        responses: {
          '201': { description: 'Leave requested' },
        },
      },
    },
    '/leave/me': {
      get: {
        tags: ['Leave'],
        summary: 'Get my leave history',
        security: bearerAuth,
        responses: {
          '200': { description: 'My leave requests' },
        },
      },
    },
    '/leave/{id}': {
      get: {
        tags: ['Leave'],
        summary: 'Get leave request by id',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Leave request found' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/leave/{id}/review': {
      patch: {
        tags: ['Leave'],
        summary: 'Approve or reject a leave request',
        security: bearerAuth,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LeaveReviewRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Leave reviewed' },
        },
      },
    },
  },
};
