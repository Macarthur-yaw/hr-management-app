import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

import AddPositionDialog from '@/components/AddPositionDialog'
import DataTable, {
  type DataTableColumn,
  type DataTableSortState,
} from '@/components/DataTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  employees: number
  createdAt: string
}

type PositionSortKey =
  | 'title'
  | 'description'
  | 'department'
  | 'accessLevel'
  | 'employees'
  | 'createdAt'

type PositionSortState = DataTableSortState<PositionSortKey>

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
  employees: position._count?.employees ?? position.employees?.length ?? 0,
  createdAt: position.createdAt
    ? new Date(position.createdAt).toLocaleDateString()
    : 'Not available',
})

const columns: DataTableColumn<Position, PositionSortKey>[] = [
  {
    key: 'title',
    header: 'Title',
    sortKey: 'title',
    getSortValue: (position) => position.title,
    render: (position) => (
      <span className="font-semibold text-slate-950">{position.title}</span>
    ),
    cellClassName: 'text-slate-950',
  },
  {
    key: 'description',
    header: 'Description',
    sortKey: 'description',
    getSortValue: (position) => position.description,
    render: (position) => position.description,
    cellClassName: 'max-w-[320px] whitespace-normal leading-6',
  },
  {
    key: 'department',
    header: 'Department',
    sortKey: 'department',
    getSortValue: (position) => position.department,
    render: (position) => position.department,
  },
  {
    key: 'accessLevel',
    header: 'Access',
    sortKey: 'accessLevel',
    getSortValue: (position) => position.accessLevel,
    render: (position) => position.accessLevel,
  },
  {
    key: 'employees',
    header: 'Employees',
    sortKey: 'employees',
    getSortValue: (position) => position.employees,
    render: (position) => position.employees,
    align: 'right',
    cellClassName: 'font-semibold text-slate-950',
  },
  {
    key: 'createdAt',
    header: 'Created',
    sortKey: 'createdAt',
    getSortValue: (position) => position.createdAt,
    render: (position) => position.createdAt,
  },
]

const initialPositionSort: PositionSortState = {
  key: 'title',
  direction: 'asc',
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
            Manage positions, access levels, and department assignments.
          </p>
        </div>

        <AddPositionDialog onPositionCreated={handlePositionCreated} />
      </div>

      <Card className="rounded-lg border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-slate-50/80">
          <CardTitle className="text-slate-950">Position List</CardTitle>
          <CardDescription>
            A list of all positions in the organization
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search positions..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white pl-10 text-slate-900 shadow-none focus:border-[#049FA7] focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>
          </div>

          <DataTable
            key={searchTerm}
            data={filteredPositions}
            columns={columns}
            getRowKey={(position) => position.id}
            initialSort={initialPositionSort}
            emptyMessage="No positions found."
            isLoading={isLoading}
            loadingLabel="Loading positions"
            minWidthClassName="min-w-[980px]"
          />
        </CardContent>
      </Card>
    </div>
  )
}
