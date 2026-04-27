import { useEffect, useState } from 'react'
import type { CellValue, ColumnDef, SortState } from 'flowers-nextjs-table'
import { Table } from 'flowers-nextjs-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AddEmployeeDialog from '@/components/AddEmployeeDialog'
import { Search, Edit3, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  employeeService,
  getApiErrorMessage,
  type BackendRole,
  type Employee as ApiEmployee,
} from '@/services/api'

interface Employee {
  id: string
  name: string
  email: string
  department: string
  role: string
  status: 'Active' | 'Inactive'
  salary: number
}

type EmployeeColumns = Employee & {
  [key: string]: CellValue
}

const roleLabels: Record<BackendRole, string> = {
  admin: 'Admin',
  hr_manager: 'HR Manager',
  employee: 'Employee',
}

const getRoleLabel = (role?: BackendRole) => (role ? roleLabels[role] : 'Employee')

const mapEmployee = (employee: ApiEmployee): Employee => ({
  id: employee.id,
  name: `${employee.firstName} ${employee.lastName}`.trim(),
  email: employee.user?.email ?? 'No email',
  department: employee.department?.name ?? 'Unassigned',
  role: employee.position?.title ?? getRoleLabel(employee.user?.role),
  status:
    employee.isActive && employee.employmentStatus !== 'terminated'
      ? 'Active'
      : 'Inactive',
  salary: Number(employee.salary ?? 0),
})

const getEmployeeColumns = ({
  onEdit,
  onDelete,
  deactivatingEmployeeId,
}: {
  onEdit?: (employee: Employee) => void
  onDelete?: (employee: Employee) => void
  deactivatingEmployeeId?: string | null
}): ColumnDef<EmployeeColumns>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    enableSorting: true,
  },
  {
    accessorKey: 'department',
    header: 'Department',
    enableSorting: true,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (employee) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          employee.status === 'Active'
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {employee.status}
      </span>
    ),
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    enableSorting: true,
    cell: (employee) => `$${Number(employee.salary).toLocaleString()}`,
  },
  {
    accessorKey: 'actions',
    header: '',
    enableSorting: false,
    enableResizing: false,
    size: 110,
    cell: (employee) => (
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-600 hover:text-slate-900"
          disabled={deactivatingEmployeeId === employee.id}
          aria-label={`Edit ${employee.name}`}
          onClick={() => onEdit?.(employee as Employee)}
        >
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-600 hover:text-slate-900"
          disabled={deactivatingEmployeeId === employee.id}
          aria-label={`Deactivate ${employee.name}`}
          onClick={() => onDelete?.(employee as Employee)}
        >
          {deactivatingEmployeeId === employee.id ? (
            <LoadingSpinner className="h-4 w-4" label={`Deactivating ${employee.name}`} />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    ),
  },
]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [deactivatingEmployeeId, setDeactivatingEmployeeId] = useState<string | null>(null)
  const [sortState, setSortState] = useState<SortState<EmployeeColumns>>({
    key: null,
    direction: 'asc',
  })

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
          setEmployees(response.employees.map(mapEmployee))
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
    setEmployees((current) => [mapEmployee(employee), ...current])
  }

  const handleEditEmployee = (employee: Employee) => {
    toast.info(`Editing ${employee.name} will use the update endpoint in the next pass`)
  }

  const handleDeleteEmployee = async (employee: Employee) => {
    if (deactivatingEmployeeId) {
      return
    }

    setDeactivatingEmployeeId(employee.id)

    try {
      const response = await employeeService.deactivate(employee.id)
      setEmployees((current) =>
        current.map((item) =>
          item.id === employee.id ? mapEmployee(response.employee) : item,
        ),
      )
      toast.success(response.message || 'Employee deactivated')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not deactivate employee'))
    } finally {
      setDeactivatingEmployeeId(null)
    }
  }

  const columns = getEmployeeColumns({
    onEdit: handleEditEmployee,
    onDelete: handleDeleteEmployee,
    deactivatingEmployeeId,
  })

  return (
    <div className="space-y-6 rounded-[32px] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950">Employees</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage employee information with live backend data.
          </p>
        </div>

        <AddEmployeeDialog onEmployeeCreated={handleEmployeeCreated} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
          <CardDescription>
            A list of all employees in the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-100 pl-10 text-slate-900 shadow-sm focus:border-[#049FA7] focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm font-medium text-slate-500">
                <LoadingSpinner label="Loading employees" />
                Loading employees...
              </div>
            ) : (
              <Table
                data={employees as EmployeeColumns[]}
                columns={columns}
                searchValue=""
                itemsPerPage={10}
                paginationMode="auto"
                sortState={sortState}
                onSortChange={setSortState}
                showPageNumbers
                classNames={{
                  table: 'min-w-full divide-y divide-slate-200 text-sm',
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
