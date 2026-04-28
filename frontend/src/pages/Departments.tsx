import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

import AddDepartmentDialog from '@/components/AddDepartmentDialog'
import DataTable, {
  type DataTableColumn,
  type DataTableSortState,
} from '@/components/DataTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  departmentService,
  getApiErrorMessage,
  type Department as ApiDepartment,
} from '@/services/api'

interface Department {
  id: string
  name: string
  description: string
  manager: string
  employees: number
  positions: number
  createdAt: string
}

type DepartmentSortKey =
  | 'name'
  | 'description'
  | 'manager'
  | 'employees'
  | 'positions'
  | 'createdAt'

type DepartmentSortState = DataTableSortState<DepartmentSortKey>

const getEmployeeName = (department: ApiDepartment) => {
  const manager = department.manager

  if (!manager) {
    return 'Unassigned'
  }

  return `${manager.firstName} ${manager.lastName}`.trim() || manager.user?.email || 'Manager'
}

const mapDepartment = (department: ApiDepartment): Department => ({
  id: department.id,
  name: department.name,
  description: department.description || 'No description',
  manager: getEmployeeName(department),
  employees: department._count?.employees ?? department.employees?.length ?? 0,
  positions: department._count?.positions ?? department.positions?.length ?? 0,
  createdAt: department.createdAt
    ? new Date(department.createdAt).toLocaleDateString()
    : 'Not available',
})

const columns: DataTableColumn<Department, DepartmentSortKey>[] = [
  {
    key: 'name',
    header: 'Name',
    sortKey: 'name',
    getSortValue: (department) => department.name,
    render: (department) => (
      <span className="font-semibold text-slate-950">{department.name}</span>
    ),
    cellClassName: 'text-slate-950',
  },
  {
    key: 'description',
    header: 'Description',
    sortKey: 'description',
    getSortValue: (department) => department.description,
    render: (department) => department.description,
    cellClassName: 'max-w-[360px] whitespace-normal leading-6',
  },
  {
    key: 'manager',
    header: 'Manager',
    sortKey: 'manager',
    getSortValue: (department) => department.manager,
    render: (department) => department.manager,
  },
  {
    key: 'employees',
    header: 'Employees',
    sortKey: 'employees',
    getSortValue: (department) => department.employees,
    render: (department) => department.employees,
    align: 'right',
    cellClassName: 'font-semibold text-slate-950',
  },
  {
    key: 'positions',
    header: 'Positions',
    sortKey: 'positions',
    getSortValue: (department) => department.positions,
    render: (department) => department.positions,
    align: 'right',
    cellClassName: 'font-semibold text-slate-950',
  },
  {
    key: 'createdAt',
    header: 'Created',
    sortKey: 'createdAt',
    getSortValue: (department) => department.createdAt,
    render: (department) => department.createdAt,
  },
]

const initialDepartmentSort: DepartmentSortState = {
  key: 'name',
  direction: 'asc',
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isActive = true

    const loadDepartments = async () => {
      setIsLoading(true)

      try {
        const response = await departmentService.list()

        if (isActive) {
          setDepartments(response.departments.map(mapDepartment))
        }
      } catch (error) {
        if (isActive) {
          toast.error(getApiErrorMessage(error, 'Could not load departments'))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadDepartments()

    return () => {
      isActive = false
    }
  }, [])

  const filteredDepartments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    if (!search) {
      return departments
    }

    return departments.filter((department) =>
      [
        department.name,
        department.description,
        department.manager,
        department.employees.toString(),
        department.positions.toString(),
      ].some((value) => value.toLowerCase().includes(search)),
    )
  }, [departments, searchTerm])

  const handleDepartmentCreated = (department: ApiDepartment) => {
    setDepartments((current) => [mapDepartment(department), ...current])
  }

  return (
    <div className="space-y-6 rounded-[32px] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950">Departments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage department structure with live backend data.
          </p>
        </div>

        <AddDepartmentDialog onDepartmentCreated={handleDepartmentCreated} />
      </div>

      <Card className="rounded-lg border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-slate-50/80">
          <CardTitle className="text-slate-950">Department List</CardTitle>
          <CardDescription>
            A list of all departments in the organization
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white pl-10 text-slate-900 shadow-none focus:border-[#049FA7] focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>
          </div>

          <DataTable
            key={searchTerm}
            data={filteredDepartments}
            columns={columns}
            getRowKey={(department) => department.id}
            initialSort={initialDepartmentSort}
            emptyMessage="No departments found."
            isLoading={isLoading}
            loadingLabel="Loading departments"
            minWidthClassName="min-w-[860px]"
          />
        </CardContent>
      </Card>
    </div>
  )
}
