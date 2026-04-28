import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  IdCard,
  LayoutDashboard,
  LogOut,
  Search,
  User,
  Users,
  ClipboardCheck,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  hasPermission,
  useAuthStore,
  type AppPermission,
} from "@/hooks/useAuth";
import type { BackendRole } from "@/services/api";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { authService } from "@/services/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarLayoutProps {
  children: ReactNode;
}

const menuItems: Array<{
  icon: typeof LayoutDashboard
  label: string
  path: string
  permission: AppPermission
  roles?: BackendRole[]
}> = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
    permission: "dashboard:view",
  },
  {
    icon: IdCard,
    label: "My Profile",
    path: "/profile",
    permission: "profile:read:self",
    roles: ["employee"],
  },
  {
    icon: Users,
    label: "Employees",
    path: "/employees",
    permission: "employees:read",
    roles: ["admin", "hr_manager"],
  },
  {
    icon: Building2,
    label: "Departments",
    path: "/departments",
    permission: "departments:manage",
    roles: ["admin"],
  },
  {
    icon: BriefcaseBusiness,
    label: "Positions",
    path: "/positions",
    permission: "positions:manage",
    roles: ["admin"],
  },
  {
    icon: ClipboardCheck,
    label: "Leave Requests",
    path: "/leave-requests",
    permission: "leave:read:self",
  },
];

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const visibleMenuItems = menuItems.filter((item) => {
    if (!hasPermission(user?.role, item.permission)) {
      return false;
    }

    return item.roles ? item.roles.includes(user?.role as BackendRole) : true;
  });

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Local logout should still succeed if the API is unavailable.
    } finally {
      logout();
      navigate("/signin");
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen w-full overflow-hidden bg-[#EAF8FB]">
        {/* ── Desktop Sidebar ── */}
        <aside
          className={cn(
            "hidden md:flex flex-col h-full bg-white border-r border-slate-100 transition-all duration-300 ease-in-out shrink-0",
            collapsed ? "w-[68px]" : "w-[220px]"
          )}
        >
          {/* Logo + Toggle */}
          <div
            className={cn(
              "flex items-center border-b border-slate-100 px-4 py-5",
              collapsed ? "justify-center" : "justify-between"
            )}
          >
            {!collapsed && (
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#049FA7] text-sm font-black text-white">
                  Hø
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-extrabold text-slate-950 truncate">HQ HR</h1>
                  <p className="text-xs text-slate-500">Management</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setCollapsed((c) => !c)}
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-[#049FA7] transition-colors",
                collapsed && "mx-auto"
              )}
              aria-label="Toggle sidebar"
            >
              <PanelLeft size={16} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            {!collapsed && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Main
              </p>
            )}

            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              const btn = (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-[#EAF8FB] text-[#049FA7]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#049FA7]"
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return btn;
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-100 p-3 space-y-2">
            {collapsed ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="grid size-9 mx-auto place-items-center rounded-full bg-[#EAF8FB] text-[#049FA7] font-bold cursor-default">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">{user?.name || "User"}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="grid size-9 mx-auto place-items-center rounded-xl text-slate-500 transition-colors hover:bg-[#EAF8FB] hover:text-[#049FA7] disabled:pointer-events-none disabled:opacity-60"
                    >
                      {isLoggingOut ? (
                        <LoadingSpinner className="size-4" label="Logging out" />
                      ) : (
                        <LogOut size={16} />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {isLoggingOut ? "Logging out" : "Logout"}
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-2xl bg-[#F8F4D9] p-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#049FA7]">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {user?.name || "User"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user?.roleLabel || "HR Manager"}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  variant="ghost"
                  className="w-full justify-start rounded-xl text-slate-600 hover:bg-[#EAF8FB] hover:text-[#049FA7]"
                >
                  {isLoggingOut ? (
                    <LoadingSpinner className="mr-2 size-4" label="Logging out" />
                  ) : (
                    <LogOut className="mr-2 size-4" />
                  )}
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
              </>
            )}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur md:px-6 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-950 leading-tight">Dashboard</h2>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Welcome back, track your team progress here.
                </p>
              </div>

              <div className="hidden max-w-sm flex-1 md:block">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder="Search"
                    className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#049FA7]/30"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="relative grid size-10 place-items-center rounded-full border border-slate-100 bg-white">
                  <Bell size={17} />
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
                </button>

                <div className="hidden items-center gap-2 rounded-full border border-slate-100 bg-white px-3 py-1.5 sm:flex">
                  <div className="grid size-8 place-items-center rounded-full bg-[#EAF8FB] font-bold text-[#049FA7] text-sm">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-slate-500">{user?.roleLabel || "HR Manager"}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-5 pb-20 md:pb-5">
            {children}
          </main>
        </div>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-100 flex items-center justify-around px-2 py-2 safe-area-bottom">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors",
                  isActive ? "text-[#049FA7]" : "text-slate-400"
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-semibold">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </TooltipProvider>
  );
}
