import { useEffect, useState, type ReactNode } from 'react'
import { BriefcaseBusiness, Building2, Mail, Phone, User } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuthStore } from '@/hooks/useAuth'
import {
  employeeService,
  getApiErrorMessage,
  type Employee,
} from '@/services/api'

const formatDate = (value?: string) => {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString()
}

const formatSalary = (salary?: string | number | null) => {
  const value = Number(salary ?? 0)
  return value > 0 ? `$${value.toLocaleString()}` : 'Not set'
}

const formatStatus = (employee?: Employee | null) => {
  if (!employee || !employee.isActive || employee.employmentStatus === 'terminated') {
    return 'Inactive'
  }

  if (employee.employmentStatus === 'on_leave') {
    return 'On leave'
  }

  return 'Active'
}

const statusClassNames: Record<string, string> = {
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'On leave': 'border-sky-200 bg-sky-50 text-sky-700',
  Inactive: 'border-red-200 bg-red-50 text-red-700',
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [employee, setEmployee] = useState<Employee | null>(
    user?.employee ?? null,
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isActive = true

    const loadProfile = async () => {
      setIsLoading(true)

      try {
        const response = await employeeService.me()

        if (isActive) {
          setEmployee(response.employee)
        }
      } catch (error) {
        if (isActive) {
          toast.error(getApiErrorMessage(error, 'Could not load your profile'))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isActive = false
    }
  }, [])

  const name = employee
    ? `${employee.firstName} ${employee.lastName}`.trim()
    : user?.name || 'Employee'
  const status = formatStatus(employee)

  return (
    <div className="space-y-6 rounded-[32px] bg-white p-8 shadow-sm">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-950">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          View your employee profile and HR record.
        </p>
      </div>

      <Card className="rounded-lg border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-slate-50/80">
          <CardTitle className="text-slate-950">Profile Details</CardTitle>
          <CardDescription>Only your own profile is available here.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm font-medium text-slate-500">
              <LoadingSpinner label="Loading profile" />
              Loading profile...
            </div>
          ) : (
            <div className="grid gap-0 md:grid-cols-[280px_minmax(0,1fr)]">
              <div className="border-b border-slate-200 bg-slate-50 p-6 md:border-b-0 md:border-r">
                <div className="grid size-20 place-items-center rounded-2xl bg-[#EAF8FB] text-[#049FA7]">
                  <User className="size-10" />
                </div>
                <h2 className="mt-5 text-xl font-extrabold text-slate-950">
                  {name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {employee?.position?.title ?? user?.roleLabel ?? 'Employee'}
                </p>
                <Badge
                  variant="outline"
                  className={`mt-4 ${statusClassNames[status]}`}
                >
                  {status}
                </Badge>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2">
                <ProfileField
                  icon={<Mail className="size-4" />}
                  label="Email"
                  value={employee?.user?.email ?? user?.email ?? 'No email'}
                />
                <ProfileField
                  icon={<Phone className="size-4" />}
                  label="Phone"
                  value={employee?.phone || 'Not provided'}
                />
                <ProfileField
                  icon={<Building2 className="size-4" />}
                  label="Department"
                  value={employee?.department?.name ?? 'Unassigned'}
                />
                <ProfileField
                  icon={<BriefcaseBusiness className="size-4" />}
                  label="Position"
                  value={employee?.position?.title ?? 'Unassigned'}
                />
                <ProfileField
                  label="Start date"
                  value={formatDate(employee?.dateJoined)}
                />
                <ProfileField
                  label="Salary"
                  value={formatSalary(employee?.salary)}
                />
                <ProfileField
                  label="Address"
                  value={employee?.address || 'Not provided'}
                  className="sm:col-span-2"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileField({
  icon,
  label,
  value,
  className,
}: {
  icon?: ReactNode
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  )
}
