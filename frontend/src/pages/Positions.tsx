import { useEffect, useMemo, useState } from 'react'
import type { CellValue, ColumnDef, SortState } from 'flowers-nextjs-table'
import { Table } from 'flowers-nextjs-table'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

import AddPositionDialog from '@/components/AddPositionDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  getApiErrorMessage,
  positionService,
  type AccessLevel,
  type Position as ApiPosition,
} from '@/services/api'

interface Position {
  id: string
  title: string
  description: string
  department: string
  accessLevel: string
  permissions: string
  employees: number
  createdAt: string
}

type PositionColumns = Position & {
  [key: string]: CellValue
}

const accessLevelLabels: Record<AccessLevel, string> = {
  basic: 'Basic',
  manager: 'Manager',
  admin: 'Admin',
}

const mapPosition = (position: ApiPosition): Position => ({
  id: position.id,
  title: position.title,
  description: position.description || 'No description',
  department: position.department?.name ?? 'Unassigned',
  accessLevel: accessLevelLabels[position.accessLevel],
  permissions:
    position.permissions.length > 0 ? position.permissions.join(', ') : 'None',
  employees: position._count?.employees ?? position.employees?.length ?? 0,
  createdAt: position.createdAt
    ? new Date(position.createdAt).toLocaleDateString()
    : 'Not available',
})

const columns: ColumnDef<PositionColumns>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    enableSorting: true,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    enableSorting: true,
  },
  {
    accessorKey: 'department',
    header: 'Department',
    enableSorting: true,
  },
  {
    accessorKey: 'accessLevel',
    header: 'Access',
    enableSorting: true,
  },
  {
    accessorKey: 'permissions',
    header: 'Permissions',
    enableSorting: true,
  },
  {
    accessorKey: 'employees',
    header: 'Employees',
    enableSorting: true,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    enableSorting: true,
  },
]

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sortState, setSortState] = useState<SortState<PositionColumns>>({
    key: null,
    direction: 'asc',
  })

  useEffect(() => {
    let isActive = true

    const loadPositions = async () => {
      setIsLoading(true)

      try {
        const response = await positionService.list()

        if (isActive) {
          setPositions(response.positions.map(mapPosition))
        }
      } catch (error) {
        if (isActive) {
          toast.error(getApiErrorMessage(error, 'Could not load positions'))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadPositions()

    return () => {
      isActive = false
    }
  }, [])

  const filteredPositions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    if (!search) {
      return positions
    }

    return positions.filter((position) =>
      [
        position.title,
        position.description,
        position.department,
        position.accessLevel,
        position.permissions,
        position.employees.toString(),
      ].some((value) => value.toLowerCase().includes(search)),
    )
  }, [positions, searchTerm])

  const handlePositionCreated = (position: ApiPosition) => {
    setPositions((current) => [mapPosition(position), ...current])
  }

  return (
    <div className="space-y-6 rounded-[32px] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950">Positions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage roles, permissions, and department assignments.
          </p>
        </div>

        <AddPositionDialog onPositionCreated={handlePositionCreated} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Position List</CardTitle>
          <CardDescription>
            A list of all positions in the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search positions..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-100 pl-10 text-slate-900 shadow-sm focus:border-[#049FA7] focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm font-medium text-slate-500">
                <LoadingSpinner label="Loading positions" />
                Loading positions...
              </div>
            ) : (
              <Table
                data={filteredPositions as PositionColumns[]}
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
