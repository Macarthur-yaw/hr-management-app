import { useEffect, useState } from 'react'
import { CheckCircle2, Edit3, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import AddEmployeeDialog from '@/components/AddEmployeeDialog'
import DataTable, {
  type DataTableColumn,
  type DataTableSortState,
} from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  employeeService,
  getApiErrorMessage,
  type BackendRole,
  type Employee as ApiEmployee,
} from '@/services/api'

type EmployeeStatus =
  | 'Active'
  | 'Pending approval'
  | 'Inactive'
  | 'On leave'
  | 'Terminated'

interface EmployeeRow {
  id: string
  name: string
  email: string
  department: string
  role: string
  status: EmployeeStatus
  salary: number
  dateJoined: string
  record: ApiEmployee
}

type SortKey =
  | 'name'
  | 'email'
  | 'department'
  | 'role'
  | 'status'
  | 'salary'
  | 'dateJoined'

type EmployeeSortState = DataTableSortState<SortKey>

const roleLabels: Record<BackendRole, string> = {
  admin: 'Admin',
  hr_manager: 'HR Manager',
  employee: 'Employee',
}

const statusClasses: Record<EmployeeStatus, string> = {
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Pending approval': 'border-amber-200 bg-amber-50 text-amber-700',
  Inactive: 'border-slate-200 bg-slate-100 text-slate-700',
  'On leave': 'border-sky-200 bg-sky-50 text-sky-700',
  Terminated: 'border-red-200 bg-red-50 text-red-700',
}

const getRoleLabel = (role?: BackendRole) => (role ? roleLabels[role] : 'Employee')

const getEmployeeStatus = (employee: ApiEmployee): EmployeeStatus => {
  const userActive = employee.user?.isActive ?? employee.isActive

  if (
    !userActive &&
    !employee.isActive &&
    employee.employmentStatus === 'inactive'
  ) {
    return 'Pending approval'
  }

  if (employee.employmentStatus === 'terminated') {
    return 'Terminated'
  }

  if (!userActive || !employee.isActive) {
    return 'Inactive'
  }

  if (employee.employmentStatus === 'on_leave') {
    return 'On leave'
  }

  if (employee.employmentStatus === 'inactive') {
    return 'Inactive'
  }

  return 'Active'
}

const formatDate = (value?: string) => {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString()
}

const mapEmployee = (employee: ApiEmployee): EmployeeRow => ({
  id: employee.id,
  name: `${employee.firstName} ${employee.lastName}`.trim(),
  email: employee.user?.email ?? 'No email',
  department: employee.department?.name ?? 'Unassigned',
  role: employee.position?.title ?? getRoleLabel(employee.user?.role),
  status: getEmployeeStatus(employee),
  salary: Number(employee.salary ?? 0),
  dateJoined: formatDate(employee.dateJoined),
  record: employee,
})

const formatSalary = (salary: number) =>
  salary > 0 ? `$${salary.toLocaleString()}` : 'Not set'

const initialEmployeeSort: EmployeeSortState = {
  key: 'name',
  direction: 'asc',
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<ApiEmployee[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [deactivatingEmployeeId, setDeactivatingEmployeeId] = useState<string | null>(null)
  const [approvingEmployeeId, setApprovingEmployeeId] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const loadEmployees = async () => {
      setIsLoading(true)

      try {
        const response = await employeeService.list({
          search: searchTerm.trim() || undefined,
          page: 1,
          limit: 100,
        })

        if (isActive) {
          setEmployees(response.employees)
        }
      } catch (error) {
        if (isActive) {
          toast.error(getApiErrorMessage(error, 'Could not load employees'))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadEmployees()
    }, 250)

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
    }
  }, [searchTerm])

  const handleEmployeeCreated = (employee: ApiEmployee) => {
    setEmployees((current) => [employee, ...current])
  }

  const handleEmployeeUpdated = (employee: ApiEmployee) => {
    setEmployees((current) =>
      current.map((item) => (item.id === employee.id ? employee : item)),
    )
  }

  const handleApproveEmployee = async (employee: EmployeeRow) => {
    if (approvingEmployeeId) {
      return
    }

    setApprovingEmployeeId(employee.id)

    try {
      const response = await employeeService.update(employee.id, {
        isActive: true,
        employmentStatus: 'active',
      })
      setEmployees((current) =>
        current.map((item) =>
          item.id === employee.id ? response.employee : item,
        ),
      )
      toast.success(`${employee.name} approved`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not approve employee'))
    } finally {
      setApprovingEmployeeId(null)
    }
  }

  const handleDeleteEmployee = async (employee: EmployeeRow) => {
    if (deactivatingEmployeeId) {
      return
    }

    setDeactivatingEmployeeId(employee.id)

    try {
      const response = await employeeService.deactivate(employee.id)
      setEmployees((current) =>
        current.map((item) =>
          item.id === employee.id ? response.employee : item,
        ),
      )
      toast.success(response.message || 'Employee deactivated')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not deactivate employee'))
    } finally {
      setDeactivatingEmployeeId(null)
    }
  }

  const columns: DataTableColumn<EmployeeRow, SortKey>[] = [
    {
      key: 'employee',
      header: 'Employee',
      sortKey: 'name',
      getSortValue: (employee) => employee.name,
      render: (employee) => (
        <span className="font-semibold text-slate-950">{employee.name}</span>
      ),
      cellClassName: 'text-slate-950',
    },
    {
      key: 'email',
      header: 'Email',
      sortKey: 'email',
      getSortValue: (employee) => employee.email,
      render: (employee) => employee.email,
    },
    {
      key: 'department',
      header: 'Department',
      sortKey: 'department',
      getSortValue: (employee) => employee.department,
      render: (employee) => employee.department,
    },
    {
      key: 'role',
      header: 'Role',
      sortKey: 'role',
      getSortValue: (employee) => employee.role,
      render: (employee) => employee.role,
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      getSortValue: (employee) => employee.status,
      render: (employee) => (
        <Badge variant="outline" className={statusClasses[employee.status]}>
          {employee.status}
        </Badge>
      ),
    },
    {
      key: 'salary',
      header: 'Salary',
      sortKey: 'salary',
      getSortValue: (employee) => employee.salary,
      render: (employee) => formatSalary(employee.salary),
      align: 'right',
      cellClassName: 'font-semibold text-slate-950',
    },
    {
      key: 'dateJoined',
      header: 'Start date',
      sortKey: 'dateJoined',
      getSortValue: (employee) => employee.dateJoined,
      render: (employee) => employee.dateJoined,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (employee) => {
        const isApproving = approvingEmployeeId === employee.id
        const isDeactivating = deactivatingEmployeeId === employee.id
        const isBusy = isApproving || isDeactivating

        return (
          <div className="flex items-center justify-end gap-2">
            {employee.status === 'Pending approval' && (
              <Button
                size="sm"
                className="h-8 rounded-md bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700"
                disabled={isBusy}
                onClick={() => void handleApproveEmployee(employee)}
              >
                {isApproving ? (
                  <LoadingSpinner
                    className="h-3.5 w-3.5"
                    label={`Approving ${employee.name}`}
                  />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Approve
              </Button>
            )}
            <AddEmployeeDialog
              employee={employee.record}
              onEmployeeUpdated={handleEmployeeUpdated}
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  disabled={isBusy}
                  aria-label={`Edit ${employee.name}`}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-slate-600 hover:bg-red-50 hover:text-red-700"
              disabled={isBusy || employee.status === 'Terminated'}
              aria-label={`Deactivate ${employee.name}`}
              onClick={() => void handleDeleteEmployee(employee)}
            >
              {isDeactivating ? (
                <LoadingSpinner
                  className="h-4 w-4"
                  label={`Deactivating ${employee.name}`}
                />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 rounded-[32px] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950">Employees</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage employee information, approvals, and account access.
          </p>
        </div>

        <AddEmployeeDialog onEmployeeCreated={handleEmployeeCreated} />
      </div>

      <Card className="rounded-lg border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-slate-50/80">
          <CardTitle className="text-slate-950">Employee List</CardTitle>
          <CardDescription>
            HR-created employees are approved immediately. Public registrations need approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white pl-10 text-slate-900 shadow-none focus:border-[#049FA7] focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>
          </div>

          <DataTable
            key={searchTerm}
            data={employees.map(mapEmployee)}
            columns={columns}
            getRowKey={(employee) => employee.id}
            initialSort={initialEmployeeSort}
            emptyMessage="No employees found."
            isLoading={isLoading}
            loadingLabel="Loading employees"
            minWidthClassName="min-w-[980px]"
          />
        </CardContent>
      </Card>
    </div>
  )
}
