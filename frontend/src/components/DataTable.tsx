import { useMemo, useState, type ReactNode } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type SortDirection = 'asc' | 'desc'
type SortValue = string | number | boolean | Date | null | undefined

export interface DataTableSortState<TSortKey extends string> {
  key: TSortKey
  direction: SortDirection
}

export interface DataTableColumn<TData, TSortKey extends string> {
  key: string
  header: ReactNode
  render?: (row: TData) => ReactNode
  getSortValue?: (row: TData) => SortValue
  sortKey?: TSortKey
  sortable?: boolean
  align?: 'left' | 'right'
  headerClassName?: string
  cellClassName?: string
}

interface DataTableProps<TData, TSortKey extends string> {
  data: TData[]
  columns: DataTableColumn<TData, TSortKey>[]
  getRowKey: (row: TData) => string
  initialSort: DataTableSortState<TSortKey>
  emptyMessage: string
  isLoading?: boolean
  loadingLabel?: string
  itemsPerPage?: number
  minWidthClassName?: string
  rowClassName?: string | ((row: TData) => string)
}

const DEFAULT_ITEMS_PER_PAGE = 10

const normalizeSortValue = (value: SortValue) => {
  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  return value ?? ''
}

const compareValues = (first: SortValue, second: SortValue) => {
  const firstValue = normalizeSortValue(first)
  const secondValue = normalizeSortValue(second)

  if (typeof firstValue === 'number' && typeof secondValue === 'number') {
    return firstValue - secondValue
  }

  return String(firstValue).localeCompare(String(secondValue), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

export default function DataTable<TData, TSortKey extends string>({
  data,
  columns,
  getRowKey,
  initialSort,
  emptyMessage,
  isLoading = false,
  loadingLabel = 'Loading',
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  minWidthClassName = 'min-w-[980px]',
  rowClassName,
}: DataTableProps<TData, TSortKey>) {
  const [sortState, setSortState] =
    useState<DataTableSortState<TSortKey>>(initialSort)
  const [currentPage, setCurrentPage] = useState(1)

  const sortedData = useMemo(() => {
    const sortColumn = columns.find(
      (column) =>
        column.sortKey === sortState.key &&
        column.sortable !== false &&
        column.getSortValue,
    )

    if (!sortColumn?.getSortValue) {
      return data
    }

    return [...data].sort((first, second) => {
      const result = compareValues(
        sortColumn.getSortValue?.(first),
        sortColumn.getSortValue?.(second),
      )

      return sortState.direction === 'asc' ? result : -result
    })
  }, [columns, data, sortState])

  const pageCount = Math.max(1, Math.ceil(sortedData.length / itemsPerPage))
  const visiblePage = Math.min(currentPage, pageCount)

  const paginatedData = useMemo(() => {
    const start = (visiblePage - 1) * itemsPerPage
    return sortedData.slice(start, start + itemsPerPage)
  }, [itemsPerPage, sortedData, visiblePage])

  const firstVisibleRow =
    sortedData.length === 0 ? 0 : (visiblePage - 1) * itemsPerPage + 1
  const lastVisibleRow = Math.min(visiblePage * itemsPerPage, sortedData.length)

  const handleSort = (key: TSortKey) => {
    setSortState((current) => {
      if (current.key !== key) {
        return { key, direction: 'asc' }
      }

      return {
        key,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      }
    })
  }

  return (
    <>
      <div className="overflow-x-auto bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm font-medium text-slate-500">
            <LoadingSpinner label={loadingLabel} />
            {loadingLabel}...
          </div>
        ) : (
          <Table className={cn(minWidthClassName, 'border-collapse')}>
            <TableHeader className="bg-slate-100">
              <TableRow className="border-b border-slate-300 hover:bg-slate-100">
                {columns.map((column, index) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      'px-4 py-3',
                      index < columns.length - 1 && 'border-r border-slate-300',
                      column.align === 'right' &&
                        'text-right text-xs font-bold uppercase tracking-wide text-slate-600',
                      column.headerClassName,
                    )}
                  >
                    {column.sortKey && column.sortable !== false ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.sortKey as TSortKey)}
                        className={cn(
                          'inline-flex w-full items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-slate-950',
                          column.align === 'right'
                            ? 'justify-end'
                            : 'justify-start',
                        )}
                        aria-label={`Sort by ${String(column.header)}`}
                      >
                        <span>{column.header}</span>
                        <ArrowUpDown
                          className={cn(
                            'h-3.5 w-3.5',
                            sortState.key === column.sortKey
                              ? 'text-[#049FA7]'
                              : 'text-slate-400',
                          )}
                        />
                        {sortState.key === column.sortKey && (
                          <span className="sr-only">
                            sorted{' '}
                            {sortState.direction === 'asc'
                              ? 'ascending'
                              : 'descending'}
                          </span>
                        )}
                      </button>
                    ) : (
                      <span
                        className={cn(
                          'block text-xs font-bold uppercase tracking-wide text-slate-600',
                          column.align === 'right' && 'text-right',
                        )}
                      >
                        {column.header}
                      </span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row) => (
                  <TableRow
                    key={getRowKey(row)}
                    className={cn(
                      'border-b border-slate-200 odd:bg-white even:bg-slate-50/60 hover:bg-[#EAF8FB]/70',
                      typeof rowClassName === 'function'
                        ? rowClassName(row)
                        : rowClassName,
                    )}
                  >
                    {columns.map((column, index) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          'px-4 py-3 text-slate-700',
                          index < columns.length - 1 &&
                            'border-r border-slate-200',
                          column.align === 'right' && 'text-right',
                          column.cellClassName,
                        )}
                      >
                        {column.render ? column.render(row) : null}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-28 px-4 text-center text-sm text-slate-500"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {firstVisibleRow}-{lastVisibleRow} of {sortedData.length}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md"
            disabled={visiblePage === 1}
            onClick={() => setCurrentPage(Math.max(1, visiblePage - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="min-w-20 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            Page {visiblePage} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md"
            disabled={visiblePage === pageCount}
            onClick={() => setCurrentPage(Math.min(pageCount, visiblePage + 1))}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
}
