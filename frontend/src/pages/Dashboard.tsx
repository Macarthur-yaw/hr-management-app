import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  Ellipsis,
  FileClock,
  Users,
  UserCheck,
} from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AddEmployeeDialog from '@/components/AddEmployeeDialog'
import { canManagePeople, useAuthStore } from "@/hooks/useAuth";
import {
  departmentService,
  employeeService,
  getApiErrorMessage,
  leaveService,
  type Department,
  type Employee,
  type LeaveRequest,
  type LeaveStatus,
} from "@/services/api";

interface DepartmentChartItem {
  name: string;
  employees: number;
}

interface LeaveStatusChartItem {
  name: string;
  status: LeaveStatus;
  value: number;
  fill: string;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const leaveStatusOptions: Array<{
  status: LeaveStatus;
  name: string;
  fill: string;
}> = [
  { status: "pending", name: "Pending", fill: "#F6B24B" },
  { status: "approved", name: "Approved", fill: "#049FA7" },
  { status: "rejected", name: "Rejected", fill: "#EF4444" },
];

const getDepartmentEmployeeCount = (department: Department) =>
  department._count?.employees ?? department.employees?.length ?? 0;

const buildLeaveStatusChartData = (
  leaveRequests: LeaveRequest[],
): LeaveStatusChartItem[] => {
  const counts: Record<LeaveStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  leaveRequests.forEach((request) => {
    counts[request.status] += 1;
  });

  return leaveStatusOptions.map((item) => ({
    ...item,
    value: counts[item.status],
  }));
};

const buildCalendar = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const cells = [
    ...Array.from({ length: firstDayOfMonth }, (_, index) => ({
      key: `blank-${index}`,
      day: null as number | null,
      isToday: false,
    })),
    ...Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;

      return {
        key: `day-${day}`,
        day,
        isToday: day === date.getDate(),
      };
    }),
  ];

  return {
    label: date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    }),
    cells,
  };
};

const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Date not available";
  }

  return `${start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} - ${end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
};

const getEmployeeName = (request: LeaveRequest) => {
  if (!request.employee) {
    return "Employee";
  }

  return `${request.employee.firstName} ${request.employee.lastName}`.trim();
};

const DepartmentChartSkeleton = () => (
  <div className="flex h-full items-end gap-3 px-2 pb-8 pt-6">
    {["h-24", "h-36", "h-28", "h-44", "h-32", "h-20"].map((height, index) => (
      <div key={index} className="flex flex-1 flex-col items-center gap-3">
        <Skeleton className={`w-full rounded-t-xl ${height}`} />
        <Skeleton className="h-3 w-full max-w-16 rounded-full" />
      </div>
    ))}
  </div>
);

const LeaveStatusSkeleton = () => (
  <div className="flex h-full items-center justify-center">
    <div className="relative grid size-32 place-items-center">
      <Skeleton className="absolute inset-0 rounded-full" />
      <div className="relative size-16 rounded-full bg-white" />
    </div>
  </div>
);

const PendingLeaveSkeleton = () => (
  <div className="space-y-3">
    {[0, 1, 2].map((item) => (
      <div key={item} className="rounded-xl border border-slate-100 p-3">
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="mt-2 h-3 w-1/2 rounded-full" />
      </div>
    ))}
  </div>
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const calendar = useMemo(() => buildCalendar(new Date()), []);
  const [overview, setOverview] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    departmentCount: 0,
    pendingLeaveRequests: 0,
  });
  const [departmentChartData, setDepartmentChartData] = useState<
    DepartmentChartItem[]
  >([]);
  const [leaveStatusChartData, setLeaveStatusChartData] = useState<
    LeaveStatusChartItem[]
  >(buildLeaveStatusChartData([]));
  const [upcomingLeaveRequests, setUpcomingLeaveRequests] = useState<
    LeaveRequest[]
  >([]);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const canViewOverview = canManagePeople(user?.role);

  useEffect(() => {
    if (!canViewOverview) {
      return;
    }

    let isActive = true;

    const loadOverview = async () => {
      setIsLoadingOverview(true);

      try {
        const [
          employeeResponse,
          activeEmployeeResponse,
          departmentResponse,
          leaveResponse,
        ] = await Promise.all([
          employeeService.list({ page: 1, limit: 1 }),
          employeeService.list({ isActive: true, page: 1, limit: 1 }),
          departmentService.list(),
          leaveService.listAll(),
        ]);

        if (isActive) {
          const leaveStatusData = buildLeaveStatusChartData(
            leaveResponse.leaveRequests,
          );
          const pendingLeaves = leaveResponse.leaveRequests
            .filter((request) => request.status === "pending")
            .sort(
              (left, right) =>
                new Date(left.startDate).getTime() -
                new Date(right.startDate).getTime(),
            );

          setOverview({
            totalEmployees: employeeResponse.pagination.total,
            activeEmployees: activeEmployeeResponse.pagination.total,
            departmentCount: departmentResponse.departments.length,
            pendingLeaveRequests:
              leaveStatusData.find((item) => item.status === "pending")?.value ??
              0,
          });
          setDepartmentChartData(
            departmentResponse.departments
              .map((department) => ({
                name: department.name,
                employees: getDepartmentEmployeeCount(department),
              }))
              .sort((left, right) => right.employees - left.employees),
          );
          setLeaveStatusChartData(leaveStatusData);
          setUpcomingLeaveRequests(pendingLeaves.slice(0, 3));
        }
      } catch (error) {
        if (isActive) {
          setOverview({
            totalEmployees: 0,
            activeEmployees: 0,
            departmentCount: 0,
            pendingLeaveRequests: 0,
          });
          setDepartmentChartData([]);
          setLeaveStatusChartData(buildLeaveStatusChartData([]));
          setUpcomingLeaveRequests([]);
          toast.error(getApiErrorMessage(error, "Could not load dashboard data"));
        }
      } finally {
        if (isActive) {
          setIsLoadingOverview(false);
        }
      }
    };

    void loadOverview();

    return () => {
      isActive = false;
    };
  }, [canViewOverview]);

  const stats = [
    {
      title: "Total Employees",
      value: canViewOverview ? overview.totalEmployees.toLocaleString() : "--",
      isLoading: canViewOverview && isLoadingOverview,
      sub: "All employee records",
      growth: "Live",
      icon: Users,
      bg: "bg-[#EAF8FB]",
    },
    {
      title: "Active Employees",
      value: canViewOverview ? overview.activeEmployees.toLocaleString() : "--",
      isLoading: canViewOverview && isLoadingOverview,
      sub: "Currently active staff",
      growth: "Live",
      icon: UserCheck,
      bg: "bg-[#F8F4D9]",
    },
    {
      title: "Departments",
      value: canViewOverview ? overview.departmentCount.toLocaleString() : "--",
      isLoading: canViewOverview && isLoadingOverview,
      sub: "Total departments",
      growth: "Live",
      icon: Building2,
      bg: "bg-[#EAF8FB]",
    },
    {
      title: "Pending Leave",
      value: canViewOverview
        ? overview.pendingLeaveRequests.toLocaleString()
        : "--",
      isLoading: canViewOverview && isLoadingOverview,
      sub: "Awaiting review",
      growth: "Live",
      icon: FileClock,
      bg: "bg-[#F8F4D9]",
    },
  ];

  const handleDashboardEmployeeCreated = (employee: Employee) => {
    setOverview((current) => ({
      ...current,
      totalEmployees: current.totalEmployees + 1,
      activeEmployees:
        employee.isActive && employee.employmentStatus !== "terminated"
          ? current.activeEmployees + 1
          : current.activeEmployees,
    }));

    const departmentName = employee.department?.name;

    if (departmentName) {
      setDepartmentChartData((current) => {
        let departmentExists = false;
        const updated = current.map((item) => {
          if (item.name !== departmentName) {
            return item;
          }

          departmentExists = true;
          return {
            ...item,
            employees: item.employees + 1,
          };
        });

        if (!departmentExists) {
          updated.push({
            name: departmentName,
            employees: 1,
          });
        }

        return updated.sort((left, right) => right.employees - left.employees);
      });
    }
  };

  const totalLeaveRequests = leaveStatusChartData.reduce(
    (total, item) => total + item.value,
    0,
  );

  return (
    <div className="space-y-5 max-w-full">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-950">
            Hello, {user?.name || "there"}!
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Welcome back, track your team progress here.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <AddEmployeeDialog onEmployeeCreated={handleDashboardEmployeeCreated} />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        {/* Left column */}
        <div className="space-y-4 min-w-0">

          {/* Stat cards */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="rounded-2xl bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <Ellipsis size={16} className="text-slate-400 shrink-0" />
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <div
                        className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.bg}`}
                      >
                        <Icon size={20} className="text-[#049FA7]" />
                      </div>
                      <div className="min-w-0">
                        {item.isLoading ? (
                          <div className="flex h-8 items-center">
                            <Skeleton className="h-8 w-20 rounded-lg" />
                          </div>
                        ) : (
                          <h3 className="text-3xl font-extrabold text-slate-950 leading-none">
                            {item.value}
                          </h3>
                        )}
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.sub}</p>
                      </div>
                      <span className="ml-auto shrink-0 rounded-full bg-[#EAF8FB] px-2 py-0.5 text-[11px] font-bold text-[#049FA7]">
                        {item.growth}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <Card className="rounded-2xl bg-white shadow-sm">
              <CardHeader className="pb-2 px-5 pt-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base font-extrabold text-slate-950">
                    Employees by Department
                  </CardTitle>
                  <span className="w-fit rounded-full bg-[#EAF8FB] px-3 py-1 text-[11px] font-bold text-[#049FA7]">
                    Live API data
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="h-[260px]">
                  {isLoadingOverview ? (
                    <DepartmentChartSkeleton />
                  ) : departmentChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={departmentChartData}
                        margin={{ top: 12, right: 8, left: -12, bottom: 8 }}
                      >
                        <CartesianGrid stroke="#EEF2F7" vertical={false} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          fontSize={11}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                          height={58}
                        />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          fontSize={11}
                          width={34}
                        />
                        <Tooltip cursor={{ fill: "rgba(4, 159, 167, 0.08)" }} />
                        <Bar
                          dataKey="employees"
                          fill="#049FA7"
                          maxBarSize={46}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm font-medium text-slate-500">
                      No department data yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-white shadow-sm">
              <CardHeader className="pb-0 px-5 pt-5">
                <CardTitle className="text-base font-extrabold text-slate-950">
                  Leave Request Status
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="h-[180px]">
                  {isLoadingOverview ? (
                    <LeaveStatusSkeleton />
                  ) : totalLeaveRequests > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="40%"
                        outerRadius="96%"
                        data={leaveStatusChartData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar dataKey="value" cornerRadius={8} />
                        <Tooltip />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm font-medium text-slate-500">
                      No leave requests yet.
                    </div>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {leaveStatusChartData.map((item) => (
                    <div key={item.status}>
                      {isLoadingOverview ? (
                        <Skeleton className="mx-auto h-5 w-8 rounded-md" />
                      ) : (
                        <p className="text-base font-extrabold text-slate-900">
                          {item.value}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-500">{item.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right sidebar / calendar */}
        <Card className="h-fit rounded-2xl bg-white shadow-sm xl:sticky xl:top-5">
          <CardHeader className="px-5 pt-5 pb-0">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-[#049FA7]" size={18} />
              <CardTitle className="text-base font-extrabold text-slate-950">
                {calendar.label}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="mt-4 grid grid-cols-7 gap-1 text-center sm:gap-2 xl:gap-1.5">
              {weekDays.map((day) => (
                <p key={day} className="text-[11px] text-slate-400 font-medium">
                  {day}
                </p>
              ))}
              {calendar.cells.map((cell) =>
                cell.day === null ? (
                  <div key={cell.key} className="aspect-square" aria-hidden="true" />
                ) : (
                  <div
                    key={cell.key}
                    className={`mx-auto flex aspect-square w-full max-w-9 items-center justify-center rounded-full text-xs font-bold sm:text-sm ${
                      cell.isToday
                        ? "bg-[#049FA7] text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {cell.day}
                  </div>
                ),
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Pending leave</h3>
              {isLoadingOverview ? (
                <Skeleton className="h-6 w-10 rounded-full" />
              ) : (
                <span className="rounded-full bg-[#EAF8FB] px-2.5 py-1 text-[11px] font-bold text-[#049FA7]">
                  {overview.pendingLeaveRequests}
                </span>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {isLoadingOverview ? (
                <PendingLeaveSkeleton />
              ) : upcomingLeaveRequests.length > 0 ? (
                upcomingLeaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-slate-100 bg-[#EAF8FB] p-3"
                  >
                    <p className="truncate text-sm font-bold text-slate-900">
                      {getEmployeeName(request)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {formatDateRange(request.startDate, request.endDate)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm font-medium text-slate-500">
                  No pending leave requests.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
