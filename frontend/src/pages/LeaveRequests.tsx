import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarPlus, CheckCircle2, Eye, Search, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import DataTable, {
  type DataTableColumn,
  type DataTableSortState,
} from '@/components/DataTable'
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
import {
  canRequestLeave,
  canReviewLeave,
  useAuthStore,
} from '@/hooks/useAuth'
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

type LeaveRequestSortKey =
  | 'employeeName'
  | 'department'
  | 'startDate'
  | 'endDate'
  | 'reason'
  | 'status'
  | 'requestedAt'

type LeaveRequestSortState = DataTableSortState<LeaveRequestSortKey>

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
}): DataTableColumn<LeaveRequestRow, LeaveRequestSortKey>[] => [
  {
    key: 'employee',
    header: 'Employee',
    sortKey: 'employeeName',
    getSortValue: (request) => request.employeeName,
    render: (request) => (
      <div>
        <div className="font-medium text-slate-900">{request.employeeName}</div>
        <div className="text-xs text-slate-500">{request.employeeEmail}</div>
      </div>
    ),
  },
  {
    key: 'department',
    header: 'Department',
    sortKey: 'department',
    getSortValue: (request) => request.department,
    render: (request) => request.department,
  },
  {
    key: 'startDate',
    header: 'Start Date',
    sortKey: 'startDate',
    getSortValue: (request) => request.startDate,
    render: (request) => request.startDate,
  },
  {
    key: 'endDate',
    header: 'End Date',
    sortKey: 'endDate',
    getSortValue: (request) => request.endDate,
    render: (request) => request.endDate,
  },
  {
    key: 'reason',
    header: 'Reason',
    sortKey: 'reason',
    getSortValue: (request) => request.reason,
    render: (request) => (
      <button
        type="button"
        onClick={() => onView(request)}
        className="max-w-[240px] truncate text-left text-sm text-slate-700 underline-offset-4 hover:text-[#049FA7] hover:underline"
      >
        {request.reason}
      </button>
    ),
    cellClassName: 'max-w-[280px]',
  },
  {
    key: 'status',
    header: 'Status',
    sortKey: 'status',
    getSortValue: (request) => request.status,
    render: (request) => getStatusBadge(request.status),
  },
  {
    key: 'requestedAt',
    header: 'Requested',
    sortKey: 'requestedAt',
    getSortValue: (request) => request.requestedAt,
    render: (request) => request.requestedAt,
  },
  {
    key: 'actions',
    header: 'Actions',
    align: 'right',
    render: (request) => {
      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-md px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => onView(request)}
            aria-label={`View leave request for ${request.employeeName}`}
          >
            <Eye className="h-4 w-4 stroke-[2.5]" />
            View
          </Button>
          {canManageLeave && request.status === 'Pending' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-md px-2.5 text-xs font-semibold text-green-700 hover:bg-green-50 hover:text-green-800"
                disabled={isReviewing}
                onClick={() => onReview(request, 'approved')}
                aria-label={`Approve leave request for ${request.employeeName}`}
              >
                <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                Approve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-md px-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 hover:text-red-800"
                disabled={isReviewing}
                onClick={() => onReview(request, 'rejected')}
                aria-label={`Reject leave request for ${request.employeeName}`}
              >
                <XCircle className="h-4 w-4 stroke-[2.5]" />
                Reject
              </Button>
            </>
          )}
        </div>
      )
    },
  },
]

const initialLeaveRequestSort: LeaveRequestSortState = {
  key: 'requestedAt',
  direction: 'desc',
}

const defaultLeaveForm = {
  startDate: '',
  endDate: '',
  reason: '',
}

export default function LeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [leaveForm, setLeaveForm] = useState(defaultLeaveForm)
  const [isReviewing, setIsReviewing] = useState(false)
  const [detailRequest, setDetailRequest] = useState<LeaveRequestRow | null>(null)
  const [reviewTarget, setReviewTarget] = useState<{
    request: LeaveRequestRow
    status: Extract<LeaveStatus, 'approved' | 'rejected'>
  } | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const { user } = useAuthStore()
  const canManageLeave = canReviewLeave(user?.role)
  const canCreateLeaveRequest = canRequestLeave(user?.role)

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

  const handleRequestLeave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      toast.error('Please provide start date, end date, and reason')
      return
    }

    setIsSubmittingRequest(true)

    try {
      const response = await leaveService.request({
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason.trim(),
      })

      setLeaveRequests((current) => [
        mapLeaveRequest(response.leaveRequest),
        ...current,
      ])
      setLeaveForm(defaultLeaveForm)
      setIsRequestDialogOpen(false)
      toast.success('Leave request submitted')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not submit leave request'))
    } finally {
      setIsSubmittingRequest(false)
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950">Leave Requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            {canManageLeave
              ? 'View, approve, and reject employee leave requests.'
              : 'Request leave and view your leave history.'}
          </p>
        </div>

        {canCreateLeaveRequest && !canManageLeave && (
          <Button
            size="lg"
            className="rounded-xl bg-[#049FA7] text-xs text-white hover:bg-[#038891]"
            onClick={() => setIsRequestDialogOpen(true)}
          >
            <CalendarPlus size={14} />
            Request Leave
          </Button>
        )}
      </div>

      <Card className="rounded-lg border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-slate-50/80">
          <CardTitle className="text-slate-950">Leave Request List</CardTitle>
          <CardDescription>
            {canManageLeave
              ? 'All leave requests from employees'
              : 'Your submitted leave requests'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search leave requests..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white pl-10 text-slate-900 shadow-none focus:border-[#049FA7] focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>
          </div>

          <DataTable
            key={searchTerm}
            data={filteredLeaveRequests}
            columns={columns}
            getRowKey={(request) => request.id}
            initialSort={initialLeaveRequestSort}
            emptyMessage="No leave requests found."
            isLoading={isLoading}
            loadingLabel="Loading leave requests"
            minWidthClassName="min-w-[1040px]"
          />
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
        open={isRequestDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmittingRequest) {
            setLeaveForm(defaultLeaveForm)
          }
          setIsRequestDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Request leave</DialogTitle>
            <DialogDescription>
              Submit your dates and reason for HR review.
            </DialogDescription>
          </DialogHeader>
          <form
            id="request-leave-form"
            onSubmit={handleRequestLeave}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="leave-start" className="text-xs font-medium text-slate-700">
                  Start date
                </Label>
                <Input
                  id="leave-start"
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(event) =>
                    setLeaveForm((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-[#049FA7] focus:bg-white focus:ring-2 focus:ring-[#049FA7]/20"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="leave-end" className="text-xs font-medium text-slate-700">
                  End date
                </Label>
                <Input
                  id="leave-end"
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(event) =>
                    setLeaveForm((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-[#049FA7] focus:bg-white focus:ring-2 focus:ring-[#049FA7]/20"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="leave-reason" className="text-xs font-medium text-slate-700">
                Reason
              </Label>
              <Textarea
                id="leave-reason"
                value={leaveForm.reason}
                onChange={(event) =>
                  setLeaveForm((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                placeholder="Share the reason for your leave"
                className="min-h-28 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#049FA7] focus:bg-white focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>
          </form>
          <DialogFooter className="border-t border-slate-100 bg-white px-0">
            <Button
              type="submit"
              form="request-leave-form"
              disabled={isSubmittingRequest}
              className="w-full rounded-xl bg-[#049FA7] text-white hover:bg-[#038891]"
            >
              {isSubmittingRequest ? (
                <>
                  <LoadingSpinner label="Submitting leave request" />
                  Submitting...
                </>
              ) : (
                'Submit request'
              )}
            </Button>
          </DialogFooter>
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
