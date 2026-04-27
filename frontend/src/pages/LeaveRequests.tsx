import { useEffect, useMemo, useState } from 'react'
import type { CellValue, ColumnDef, SortState } from 'flowers-nextjs-table'
import { Table } from 'flowers-nextjs-table'
import { CheckCircle2, Eye, Search, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Textarea } from '@/components/ui/textarea'
import { canManagePeople, useAuthStore } from '@/hooks/useAuth'
import {
  getApiErrorMessage,
  leaveService,
  type LeaveRequest,
  type LeaveStatus,
} from '@/services/api'

interface LeaveRequestRow {
  id: string
  employeeName: string
  employeeEmail: string
  department: string
  startDate: string
  endDate: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  requestedAt: string
  reviewedBy: string
  reviewComment: string
  raw: LeaveRequest
}

type LeaveRequestColumns = LeaveRequestRow & {
  [key: string]: CellValue
}

const statusLabels: Record<LeaveStatus, LeaveRequestRow['status']> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

const reviewActionLabels: Record<Extract<LeaveStatus, 'approved' | 'rejected'>, string> = {
  approved: 'Approve',
  rejected: 'Reject',
}

const mapLeaveRequest = (request: LeaveRequest): LeaveRequestRow => ({
  id: request.id,
  employeeName: request.employee
    ? `${request.employee.firstName} ${request.employee.lastName}`.trim()
    : 'Employee',
  employeeEmail: request.employee?.user?.email ?? 'No email',
  department: request.employee?.department?.name ?? 'Unassigned',
  startDate: new Date(request.startDate).toLocaleDateString(),
  endDate: new Date(request.endDate).toLocaleDateString(),
  reason: request.reason,
  status: statusLabels[request.status],
  requestedAt: new Date(request.createdAt).toLocaleDateString(),
  reviewedBy: request.reviewedBy?.email ?? 'Not reviewed',
  reviewComment: request.reviewComment || 'No review comment',
  raw: request,
})

const getStatusBadge = (status: LeaveRequestRow['status']) => {
  switch (status) {
    case 'Approved':
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>
    case 'Rejected':
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
    default:
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
  }
}

const getLeaveColumns = ({
  canManageLeave,
  isReviewing,
  onView,
  onReview,
}: {
  canManageLeave: boolean
  isReviewing: boolean
  onView: (request: LeaveRequestRow) => void
  onReview: (
    request: LeaveRequestRow,
    status: Extract<LeaveStatus, 'approved' | 'rejected'>,
  ) => void
}): ColumnDef<LeaveRequestColumns>[] => [
  {
    accessorKey: 'employeeName',
    header: 'Employee',
    enableSorting: true,
    cell: (request) => (
      <div>
        <div className="font-medium text-slate-900">{request.employeeName}</div>
        <div className="text-xs text-slate-500">{request.employeeEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: 'department',
    header: 'Department',
    enableSorting: true,
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    enableSorting: true,
  },
  {
    accessorKey: 'endDate',
    header: 'End Date',
    enableSorting: true,
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
    enableSorting: true,
    cell: (request) => (
      <button
        type="button"
        onClick={() => onView(request as LeaveRequestRow)}
        className="max-w-[240px] truncate text-left text-sm text-slate-700 underline-offset-4 hover:text-[#049FA7] hover:underline"
      >
        {request.reason}
      </button>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: true,
    cell: (request) => getStatusBadge(request.status),
  },
  {
    accessorKey: 'requestedAt',
    header: 'Requested',
    enableSorting: true,
  },
  {
    accessorKey: 'actions',
    header: '',
    enableSorting: false,
    enableResizing: false,
    size: canManageLeave ? 170 : 70,
    cell: (request) => {
      const row = request as LeaveRequestRow

      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900"
            onClick={() => onView(row)}
            aria-label={`View leave request for ${row.employeeName}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canManageLeave && row.status === 'Pending' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-800"
                disabled={isReviewing}
                onClick={() => onReview(row, 'approved')}
                aria-label={`Approve leave request for ${row.employeeName}`}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-800"
                disabled={isReviewing}
                onClick={() => onReview(row, 'rejected')}
                aria-label={`Reject leave request for ${row.employeeName}`}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )
    },
  },
]

export default function LeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [detailRequest, setDetailRequest] = useState<LeaveRequestRow | null>(null)
  const [reviewTarget, setReviewTarget] = useState<{
    request: LeaveRequestRow
    status: Extract<LeaveStatus, 'approved' | 'rejected'>
  } | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [sortState, setSortState] = useState<SortState<LeaveRequestColumns>>({
    key: null,
    direction: 'asc',
  })
  const { user } = useAuthStore()
  const canManageLeave = canManagePeople(user?.role)

  useEffect(() => {
    let isActive = true

    const loadLeaveRequests = async () => {
      setIsLoading(true)

      try {
        const response = canManageLeave
          ? await leaveService.listAll()
          : await leaveService.listMine()

        if (isActive) {
          setLeaveRequests(response.leaveRequests.map(mapLeaveRequest))
        }
      } catch (error) {
        if (isActive) {
          toast.error(getApiErrorMessage(error, 'Could not load leave requests'))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadLeaveRequests()

    return () => {
      isActive = false
    }
  }, [canManageLeave])

  const filteredLeaveRequests = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    if (!search) {
      return leaveRequests
    }

    return leaveRequests.filter((request) =>
      [
        request.employeeName,
        request.employeeEmail,
        request.department,
        request.reason,
        request.status,
        request.startDate,
        request.endDate,
        request.reviewedBy,
        request.reviewComment,
      ].some((value) => value.toLowerCase().includes(search)),
    )
  }, [leaveRequests, searchTerm])

  const handleOpenReview = (
    request: LeaveRequestRow,
    status: Extract<LeaveStatus, 'approved' | 'rejected'>,
  ) => {
    setReviewComment('')
    setReviewTarget({ request, status })
  }

  const handleReview = async () => {
    if (!reviewTarget) {
      return
    }

    setIsReviewing(true)

    try {
      const response = await leaveService.review(reviewTarget.request.id, {
        status: reviewTarget.status,
        reviewComment: reviewComment.trim() || undefined,
      })

      setLeaveRequests((requests) =>
        requests.map((request) =>
          request.id === reviewTarget.request.id
            ? mapLeaveRequest(response.leaveRequest)
            : request,
        ),
      )
      toast.success(`Leave request ${reviewTarget.status}`)
      setReviewTarget(null)
      setReviewComment('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not review leave request'))
    } finally {
      setIsReviewing(false)
    }
  }

  const columns = getLeaveColumns({
    canManageLeave,
    isReviewing,
    onView: setDetailRequest,
    onReview: handleOpenReview,
  })

  return (
    <div className="space-y-6 rounded-[32px] bg-white p-8 shadow-sm">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-950">Leave Requests</h1>
        <p className="mt-1 text-sm text-slate-500">
          {canManageLeave
            ? 'View, approve, and reject employee leave requests.'
            : 'View your leave request history.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Request List</CardTitle>
          <CardDescription>
            {canManageLeave
              ? 'All leave requests from employees'
              : 'Your submitted leave requests'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search leave requests..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-100 pl-10 text-slate-900 shadow-sm focus:border-[#049FA7] focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm font-medium text-slate-500">
                <LoadingSpinner label="Loading leave requests" />
                Loading leave requests...
              </div>
            ) : (
              <Table
                data={filteredLeaveRequests as LeaveRequestColumns[]}
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

      <Dialog open={detailRequest !== null} onOpenChange={(open) => !open && setDetailRequest(null)}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Leave request details</DialogTitle>
            <DialogDescription>
              {detailRequest?.employeeName} submitted this request.
            </DialogDescription>
          </DialogHeader>
          {detailRequest && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">Start</p>
                  <p className="mt-1 font-semibold text-slate-900">{detailRequest.startDate}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">End</p>
                  <p className="mt-1 font-semibold text-slate-900">{detailRequest.endDate}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">Status</p>
                  <div className="mt-1">{getStatusBadge(detailRequest.status)}</div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">Reviewed by</p>
                  <p className="mt-1 font-semibold text-slate-900">{detailRequest.reviewedBy}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">Reason</p>
                <p className="mt-2 rounded-2xl border border-slate-200 bg-white p-3 leading-6 text-slate-700">
                  {detailRequest.reason}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">Review comment</p>
                <p className="mt-2 rounded-2xl border border-slate-200 bg-white p-3 leading-6 text-slate-700">
                  {detailRequest.reviewComment}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={reviewTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isReviewing) {
            setReviewTarget(null)
            setReviewComment('')
          }
        }}
      >
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>
              {reviewTarget ? reviewActionLabels[reviewTarget.status] : 'Review'} leave request
            </DialogTitle>
            <DialogDescription>
              Review the employee reason before submitting your decision.
            </DialogDescription>
          </DialogHeader>
          {reviewTarget && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                <p className="font-semibold text-slate-900">
                  {reviewTarget.request.employeeName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {reviewTarget.request.startDate} - {reviewTarget.request.endDate}
                </p>
                <p className="mt-3 rounded-xl border border-slate-200 bg-white p-3 leading-6 text-slate-700">
                  {reviewTarget.request.reason}
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="review-comment" className="text-xs font-medium text-slate-700">
                  Review comment
                </Label>
                <Textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Optional note for the employee"
                  className="min-h-24 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#049FA7] focus:bg-white focus:ring-2 focus:ring-[#049FA7]/20"
                />
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-slate-100 bg-white px-0">
            <Button
              type="button"
              disabled={isReviewing}
              onClick={() => void handleReview()}
              className={
                reviewTarget?.status === 'rejected'
                  ? 'w-full rounded-xl bg-red-600 text-white hover:bg-red-700'
                  : 'w-full rounded-xl bg-[#049FA7] text-white hover:bg-[#038891]'
              }
            >
              {isReviewing ? (
                <>
                  <LoadingSpinner label="Submitting review" />
                  Submitting...
                </>
              ) : (
                `${reviewTarget ? reviewActionLabels[reviewTarget.status] : 'Review'} request`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
