import { useEffect, useMemo, useState } from 'react'
import type { CellValue, ColumnDef, SortState } from 'flowers-nextjs-table'
import { Table } from 'flowers-nextjs-table'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

import AddDepartmentDialog from '@/components/AddDepartmentDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
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

type DepartmentColumns = Department & {
  [key: string]: CellValue
}

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

const columns: ColumnDef<DepartmentColumns>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    enableSorting: true,
  },
  {
    accessorKey: 'manager',
    header: 'Manager',
    enableSorting: true,
  },
  {
    accessorKey: 'employees',
    header: 'Employees',
    enableSorting: true,
  },
  {
    accessorKey: 'positions',
    header: 'Positions',
    enableSorting: true,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    enableSorting: true,
  },
]

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sortState, setSortState] = useState<SortState<DepartmentColumns>>({
    key: null,
    direction: 'asc',
  })

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

      <Card>
        <CardHeader>
          <CardTitle>Department List</CardTitle>
          <CardDescription>
            A list of all departments in the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-100 pl-10 text-slate-900 shadow-sm focus:border-[#049FA7] focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm font-medium text-slate-500">
                <LoadingSpinner label="Loading departments" />
                Loading departments...
              </div>
            ) : (
              <Table
                data={filteredDepartments as DepartmentColumns[]}
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
