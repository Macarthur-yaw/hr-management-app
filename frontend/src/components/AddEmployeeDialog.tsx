import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Plus, UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  departmentService,
  employeeService,
  getApiErrorMessage,
  positionService,
  type Department,
  type Employee,
  type Position,
} from '@/services/api'

interface AddEmployeeDialogProps {
  onEmployeeCreated?: (employee: Employee) => void
  onEmployeeUpdated?: (employee: Employee) => void
  employee?: Employee | null
  trigger?: ReactNode
}

const defaultForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  departmentId: '',
  positionId: '',
  salary: '',
}

const UNASSIGNED_SELECT_VALUE = '__unassigned__'

const getFormFromEmployee = (employee?: Employee | null) => {
  if (!employee) {
    return defaultForm
  }

  return {
    firstName: employee.firstName ?? '',
    lastName: employee.lastName ?? '',
    email: employee.user?.email ?? '',
    phone: employee.phone ?? '',
    departmentId: employee.departmentId ?? employee.department?.id ?? '',
    positionId: employee.positionId ?? employee.position?.id ?? '',
    salary:
      employee.salary !== null && employee.salary !== undefined
        ? String(employee.salary)
        : '',
  }
}

const getDateFromEmployee = (employee?: Employee | null) => {
  if (!employee?.dateJoined) {
    return undefined
  }

  const date = new Date(employee.dateJoined)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export default function AddEmployeeDialog({
  employee,
  onEmployeeCreated,
  onEmployeeUpdated,
  trigger,
}: AddEmployeeDialogProps) {
  const formId = useId()
  const isEditing = Boolean(employee)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(() => getFormFromEmployee(employee))
  const [dateJoined, setDateJoined] = useState<Date | undefined>(() =>
    getDateFromEmployee(employee),
  )
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoadingLookups, setIsLoadingLookups] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const availablePositions = useMemo(() => {
    if (!form.departmentId) return positions
    return positions.filter((p) => p.departmentId === form.departmentId)
  }, [form.departmentId, positions])

  useEffect(() => {
    if (!open) return

    const loadLookups = async () => {
      setIsLoadingLookups(true)
      try {
        const [departmentResponse, positionResponse] = await Promise.all([
          departmentService.list(),
          positionService.list(),
        ])
        setDepartments(departmentResponse.departments)
        setPositions(positionResponse.positions)
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, 'Could not load departments and positions'),
        )
      } finally {
        setIsLoadingLookups(false)
      }
    }

    void loadLookups()
  }, [open])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    setForm(nextOpen ? getFormFromEmployee(employee) : defaultForm)
    setDateJoined(nextOpen ? getDateFromEmployee(employee) : undefined)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleDepartmentChange = (value: string) => {
    setForm((current) => ({
      ...current,
      departmentId: value === UNASSIGNED_SELECT_VALUE ? '' : value,
      positionId: '',
    }))
  }

  const handlePositionChange = (value: string) => {
    setForm((current) => ({
      ...current,
      positionId: value === UNASSIGNED_SELECT_VALUE ? '' : value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error('First name, last name, and email are required')
      return
    }

    setIsSaving(true)

    try {
      if (isEditing && employee) {
        const response = await employeeService.update(employee.id, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          departmentId: form.departmentId,
          positionId: form.positionId,
          salary: form.salary ? Number(form.salary) : undefined,
          dateJoined: dateJoined ? format(dateJoined, 'yyyy-MM-dd') : undefined,
        })

        onEmployeeUpdated?.(response.employee)
        toast.success('Employee updated successfully')
        handleOpenChange(false)
        return
      }

      const response = await employeeService.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        departmentId: form.departmentId || undefined,
        positionId: form.positionId || undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        dateJoined: dateJoined ? format(dateJoined, 'yyyy-MM-dd') : undefined,
      })

      onEmployeeCreated?.(response.employee)
      setForm(defaultForm)
      setDateJoined(undefined)
      toast.success('Employee account created and login email sent')
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isEditing ? 'Employee could not be updated' : 'Employee could not be added',
        ),
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            size="lg"
            className="rounded-xl bg-[#049FA7] text-xs text-white hover:bg-[#038891]"
          >
            <Plus size={14} />
            Add Employee
          </Button>
        )}
      </DialogTrigger>

      {/* max-h + flex-col + overflow-hidden keeps the dialog from growing off-screen */}
      <DialogContent className="flex max-h-[90vh] max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:max-w-xl">

        {/* ── Fixed header ── */}
        <DialogHeader className="shrink-0 px-6 pt-6">
          <div className="flex items-center gap-4 rounded-2xl bg-[#EAF8FB] p-4 mt-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#049FA7]/10 text-[#049FA7]">
              <UserPlus size={22} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">
                {isEditing ? 'Edit employee' : 'Add new employee'}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-slate-500">
                {isEditing
                  ? 'Update employee profile and account details.'
                  : 'Create an approved employee profile and user account.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          <form id={formId} onSubmit={handleSubmit} className="grid gap-4">

            {/* Loading state */}
            {isLoadingLookups && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                <LoadingSpinner label="Loading departments and positions" />
                Loading departments and positions…
              </div>
            )}

            {/* First name / Last name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="firstName" className="text-xs font-medium text-slate-700">
                  First name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Jane"
                  className="rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#049FA7] focus:bg-white focus:ring-2 focus:ring-[#049FA7]/20"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium text-slate-700">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Cooper"
                  className="rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#049FA7] focus:bg-white focus:ring-2 focus:ring-[#049FA7]/20"
                />
              </div>
            </div>

            {/* Email */}
            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane.cooper@example.com"
                className="rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#049FA7] focus:bg-white focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>

            {/* Department / Position */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="department" className="text-xs font-medium text-slate-700">
                  Department
                </Label>
                <Select
                  value={form.departmentId}
                  onValueChange={handleDepartmentChange}
                  disabled={isLoadingLookups}
                >
                  <SelectTrigger className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-visible:border-[#049FA7] focus-visible:ring-2 focus-visible:ring-[#049FA7]/20">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="w-(--radix-select-trigger-width)">
                    {form.departmentId && (
                      <SelectItem value={UNASSIGNED_SELECT_VALUE}>
                        Unassigned
                      </SelectItem>
                    )}
                    {departments.length > 0 ? (
                      departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-departments" disabled>
                        No departments available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="position" className="text-xs font-medium text-slate-700">
                  Position
                </Label>
                <Select
                  value={form.positionId}
                  onValueChange={handlePositionChange}
                  disabled={isLoadingLookups || availablePositions.length === 0}
                >
                  <SelectTrigger className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-visible:border-[#049FA7] focus-visible:ring-2 focus-visible:ring-[#049FA7]/20">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent className="w-(--radix-select-trigger-width)">
                    {form.positionId && (
                      <SelectItem value={UNASSIGNED_SELECT_VALUE}>
                        Unassigned
                      </SelectItem>
                    )}
                    {availablePositions.length > 0 ? (
                      availablePositions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-positions" disabled>
                        No positions available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Phone / Salary / Start date */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="phone" className="text-xs font-medium text-slate-700">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 555-987-6543"
                  className="rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#049FA7] focus:bg-white focus:ring-2 focus:ring-[#049FA7]/20"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="salary" className="text-xs font-medium text-slate-700">
                  Salary
                </Label>
                <Input
                  id="salary"
                  name="salary"
                  type="number"
                  min="0"
                  value={form.salary}
                  onChange={handleChange}
                  placeholder="60,000"
                  className="rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#049FA7] focus:bg-white focus:ring-2 focus:ring-[#049FA7]/20"
                />
              </div>

              {/* shadcn Calendar date picker */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-slate-700">Start date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm font-normal text-slate-900 hover:bg-slate-100 focus-visible:border-[#049FA7] focus-visible:ring-2 focus-visible:ring-[#049FA7]/20',
                        !dateJoined && 'text-slate-400',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      {dateJoined ? format(dateJoined, 'MMM d, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto border-0 bg-white p-0 ring-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={dateJoined}
                      onSelect={setDateJoined}
                      className="bg-white"
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

          </form>
        </div>

        {/* ── Pinned footer (always visible, never scrolls away) ── */}
        <DialogFooter className="shrink-0 border-t border-slate-100 bg-white px-6 py-10">
          <Button
            type="submit"
            form={formId}
            disabled={isSaving}
            className="w-full rounded-xl bg-[#049FA7] text-sm font-semibold text-white hover:bg-[#038891] focus-visible:ring-[#049FA7]/40"
          >
            {isSaving ? (
              <>
                <LoadingSpinner
                  label={isEditing ? 'Updating employee' : 'Saving employee'}
                />
                {isEditing ? 'Updating employee...' : 'Saving employee...'}
              </>
            ) : (
              isEditing ? 'Update employee' : 'Save employee'
            )}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
