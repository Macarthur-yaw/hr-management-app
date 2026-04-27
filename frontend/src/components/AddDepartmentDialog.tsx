import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Building2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import {
  departmentService,
  employeeService,
  getApiErrorMessage,
  type Department,
  type Employee,
} from '@/services/api'

interface AddDepartmentDialogProps {
  onDepartmentCreated?: (department: Department) => void
}

const NO_MANAGER_VALUE = 'no-manager'

const defaultForm = {
  name: '',
  description: '',
  managerId: NO_MANAGER_VALUE,
}

const getEmployeeName = (employee: Employee) => {
  return `${employee.firstName} ${employee.lastName}`.trim() || employee.user?.email || 'Employee'
}

export default function AddDepartmentDialog({
  onDepartmentCreated,
}: AddDepartmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const managerOptions = useMemo(
    () =>
      employees.filter(
        (employee) => employee.isActive && employee.employmentStatus !== 'terminated',
      ),
    [employees],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    const loadEmployees = async () => {
      setIsLoadingEmployees(true)

      try {
        const response = await employeeService.list({
          isActive: true,
          page: 1,
          limit: 100,
        })
        setEmployees(response.employees)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Could not load manager options'))
      } finally {
        setIsLoadingEmployees(false)
      }
    }

    void loadEmployees()
  }, [open])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      setForm(defaultForm)
    }
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error('Please provide department name')
      return
    }

    setIsSaving(true)

    try {
      const response = await departmentService.create({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        managerId:
          form.managerId === NO_MANAGER_VALUE ? undefined : form.managerId,
      })

      onDepartmentCreated?.(response.department)
      setForm(defaultForm)
      setOpen(false)
      toast.success('Department created successfully')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Department could not be created'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="rounded-xl bg-[#049FA7] text-xs text-white hover:bg-[#038891]"
        >
          <Plus size={14} />
          Add Department
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 px-6 pt-6">
          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-[#EAF8FB] p-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#049FA7]/10 text-[#049FA7]">
              <Building2 size={22} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">
                Add new department
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-slate-500">
                Create a department and optionally assign a manager.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="add-department-form" onSubmit={handleSubmit} className="grid gap-4">
            {isLoadingEmployees && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                <LoadingSpinner label="Loading manager options" />
                Loading manager options...
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="department-name" className="text-xs font-medium text-slate-700">
                Department name
              </Label>
              <Input
                id="department-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="People Operations"
                className="rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#049FA7] focus:bg-white focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>

            <div className="grid gap-1.5">
              <Label
                htmlFor="department-description"
                className="text-xs font-medium text-slate-700"
              >
                Description
              </Label>
              <Textarea
                id="department-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe what this department handles"
                className="min-h-24 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#049FA7] focus:bg-white focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Manager
              </Label>
              <Select
                value={form.managerId}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, managerId: value }))
                }
                disabled={isLoadingEmployees}
              >
                <SelectTrigger className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-visible:border-[#049FA7] focus-visible:ring-2 focus-visible:ring-[#049FA7]/20">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent className="w-(--radix-select-trigger-width)">
                  <SelectItem value={NO_MANAGER_VALUE}>No manager</SelectItem>
                  {managerOptions.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {getEmployeeName(employee)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-100 bg-white px-6 py-6">
          <Button
            type="submit"
            form="add-department-form"
            disabled={isSaving}
            className="w-full rounded-xl bg-[#049FA7] text-sm font-semibold text-white hover:bg-[#038891] focus-visible:ring-[#049FA7]/40"
          >
            {isSaving ? (
              <>
                <LoadingSpinner label="Saving department" />
                Saving department...
              </>
            ) : (
              'Save department'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
