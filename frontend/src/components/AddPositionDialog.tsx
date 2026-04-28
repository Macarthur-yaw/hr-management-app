import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { BriefcaseBusiness, Plus } from 'lucide-react'
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
  getApiErrorMessage,
  positionService,
  type AccessLevel,
  type Department,
  type Position,
} from '@/services/api'

interface AddPositionDialogProps {
  onPositionCreated?: (position: Position) => void
}

const NO_DEPARTMENT_VALUE = 'no-department'

const accessLevelLabels: Record<AccessLevel, string> = {
  basic: 'Basic',
  manager: 'Manager',
  admin: 'Admin',
}

const defaultForm = {
  title: '',
  description: '',
  departmentId: NO_DEPARTMENT_VALUE,
  accessLevel: 'basic' as AccessLevel,
}

export default function AddPositionDialog({
  onPositionCreated,
}: AddPositionDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    const loadDepartments = async () => {
      setIsLoadingDepartments(true)

      try {
        const response = await departmentService.list()
        setDepartments(response.departments)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Could not load departments'))
      } finally {
        setIsLoadingDepartments(false)
      }
    }

    void loadDepartments()
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
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.title.trim()) {
      toast.error('Please provide position title')
      return
    }

    setIsSaving(true)

    try {
      const response = await positionService.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        departmentId:
          form.departmentId === NO_DEPARTMENT_VALUE ? undefined : form.departmentId,
        accessLevel: form.accessLevel,
      })

      onPositionCreated?.(response.position)
      setForm(defaultForm)
      setOpen(false)
      toast.success('Position created successfully')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Position could not be created'))
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
          Add Position
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 px-6 pt-6">
          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-[#EAF8FB] p-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#049FA7]/10 text-[#049FA7]">
              <BriefcaseBusiness size={22} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">
                Add new position
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-slate-500">
                Create a position and attach it to a department. Permissions are role-based.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="add-position-form" onSubmit={handleSubmit} className="grid gap-4">
            {isLoadingDepartments && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                <LoadingSpinner label="Loading departments" />
                Loading departments...
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="position-title" className="text-xs font-medium text-slate-700">
                Position title
              </Label>
              <Input
                id="position-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="HR Coordinator"
                className="rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#049FA7] focus:bg-white focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="position-description" className="text-xs font-medium text-slate-700">
                Description
              </Label>
              <Textarea
                id="position-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the role responsibilities"
                className="min-h-24 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#049FA7] focus:bg-white focus:ring-2 focus:ring-[#049FA7]/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Department
                </Label>
                <Select
                  value={form.departmentId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, departmentId: value }))
                  }
                  disabled={isLoadingDepartments}
                >
                  <SelectTrigger className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-visible:border-[#049FA7] focus-visible:ring-2 focus-visible:ring-[#049FA7]/20">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="w-(--radix-select-trigger-width)">
                    <SelectItem value={NO_DEPARTMENT_VALUE}>No department</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Access level
                </Label>
                <Select
                  value={form.accessLevel}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      accessLevel: value as AccessLevel,
                    }))
                  }
                >
                  <SelectTrigger className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-visible:border-[#049FA7] focus-visible:ring-2 focus-visible:ring-[#049FA7]/20">
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent className="w-(--radix-select-trigger-width)">
                    {Object.entries(accessLevelLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-100 bg-white px-6 py-6">
          <Button
            type="submit"
            form="add-position-form"
            disabled={isSaving}
            className="w-full rounded-xl bg-[#049FA7] text-sm font-semibold text-white hover:bg-[#038891] focus-visible:ring-[#049FA7]/40"
          >
            {isSaving ? (
              <>
                <LoadingSpinner label="Saving position" />
                Saving position...
              </>
            ) : (
              'Save position'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
