import { useEffect, useRef, useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  Users,
  Heart,
  DollarSign,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  UserCircle,
  Menu,
  X,
  Gift,
  Target,
  Warehouse,
  FileText,
  BookUser,
  Briefcase,
  GraduationCap,
  UserCheck,
  Star,
  TrendingUp,
  Building2,
  Rocket,
  FileBarChart,
  HeartHandshake,
  UsersRound,
  LogOut,
  Sun,
  Moon,
  CalendarClock,
  Check,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import logoUrl from "../assets/hope-logo.jpeg"
import { useAuth } from "../context/AuthContext"
import usePersistentState from "../hooks/usePersistentState"
import { apiRequest } from "../services/apiClient"

interface NavItem {
  label: string
  icon: React.ReactNode
  path?: string
  children?: { label: string; path: string; icon?: React.ReactNode }[]
}

interface DashboardReminders {
  upcomingEvents: { title: string; date: string; location: string; type: string }[]
  pendingTasks: { task: string; priority: string; due: string }[]
}

interface Reminder {
  id: string
  title: string
  detail: string
  type: "event" | "task"
  important: boolean
}

const navConfig: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard size={17} />,
    path: "/dashboard",
  },
  {
    label: "Projects",
    icon: <FolderKanban size={17} />,
    children: [
      {
        label: "All Projects",
        path: "/projects",
        icon: <FolderKanban size={14} />,
      },
      {
        label: "Activate",
        path: "/projects/activate",
        icon: <Rocket size={14} />,
      },
      {
        label: "Project Reports",
        path: "/projects/reports",
        icon: <FileBarChart size={14} />,
      },
      {
        label: "Proposals",
        path: "/projects/proposals",
        icon: <FileText size={14} />,
      },
      {
        label: "Planning",
        path: "/projects/planning",
        icon: <Target size={14} />,
      },
    ],
  },
  {
    label: "Events",
    icon: <CalendarDays size={17} />,
    children: [
      {
        label: "All Events",
        path: "/events",
        icon: <CalendarDays size={14} />,
      },
      {
        label: "Calendar",
        path: "/events/calendar",
        icon: <CalendarDays size={14} />,
      },
    ],
  },
  { label: "Beneficiaries", icon: <Heart size={17} />, path: "/beneficiaries" },
  {
    label: "Resources & Budget",
    icon: <Warehouse size={17} />,
    path: "/resources",
  },
  {
    label: "Occasions",
    icon: <Gift size={17} />,
    children: [
      {
        label: "Calendar",
        path: "/occasions",
        icon: <CalendarDays size={14} />,
      },
      { label: "Engagement", path: "/engagement", icon: <Target size={14} /> },
      { label: "Outcomes", path: "/outcomes", icon: <TrendingUp size={14} /> },
    ],
  },
  {
    label: "Reports",
    icon: <BarChart3 size={17} />,
    children: [
      { label: "Analytics", path: "/reports", icon: <BarChart3 size={14} /> },
      {
        label: "Department",
        path: "/reports/department",
        icon: <Building2 size={14} />,
      },
    ],
  },
  {
    label: "Communication",
    icon: <MessageSquare size={17} />,
    path: "/communication",
  },
  {
    label: "Birthday Project",
    icon: <Gift size={17} />,
    children: [
      {
        label: "Overview",
        path: "/birthday-project/dashboard",
        icon: <LayoutDashboard size={14} />,
      },
      {
        label: "Profiles",
        path: "/birthday-project/profiles",
        icon: <Users size={14} />,
      },
      {
        label: "Occasions",
        path: "/birthday-project/occasions",
        icon: <CalendarDays size={14} />,
      },
      {
        label: "Engagement",
        path: "/birthday-project/engagement",
        icon: <MessageSquare size={14} />,
      },
      {
        label: "Outcomes",
        path: "/birthday-project/outcomes",
        icon: <TrendingUp size={14} />,
      },
      {
        label: "Departments & RBAC",
        path: "/birthday-project/departments",
        icon: <Building2 size={14} />,
      },
      {
        label: "Reports",
        path: "/birthday-project/reports",
        icon: <BarChart3 size={14} />,
      },
      {
        label: "Action Workspace",
        path: "/birthday-project/action-workspace",
        icon: <Target size={14} />,
      },
    ],
  },
  {
    label: "Donor Management",
    icon: <HeartHandshake size={17} />,
    children: [
      {
        label: "Dashboard",
        path: "/donor-management/admin/dashboard",
        icon: <LayoutDashboard size={14} />,
      },
      {
        label: "Directory",
        path: "/donor-management/admin/directory",
        icon: <BookUser size={14} />,
      },
      {
        label: "Contributions",
        path: "/donor-management/admin/contributions",
        icon: <DollarSign size={14} />,
      },
      {
        label: "Campaigns",
        path: "/donor-management/admin/campaigns",
        icon: <Star size={14} />,
      },
      {
        label: "Communications",
        path: "/donor-management/admin/communications",
        icon: <MessageSquare size={14} />,
      },
      {
        label: "Follow-Up",
        path: "/donor-management/admin/followup",
        icon: <Target size={14} />,
      },
      {
        label: "Reports",
        path: "/donor-management/admin/reports",
        icon: <BarChart3 size={14} />,
      },
    ],
  },
  {
    label: "People Management",
    icon: <UsersRound size={17} />,
    children: [
      {
        label: "Overview",
        path: "/people-management",
        icon: <UsersRound size={14} />,
      },
      {
        label: "HR Management",
        path: "/people-management/hr",
        icon: <Briefcase size={14} />,
      },
      {
        label: "Interns",
        path: "/people-management/interns",
        icon: <GraduationCap size={14} />,
      },
      {
        label: "Volunteers",
        path: "/people-management/volunteers",
        icon: <UserCheck size={14} />,
      },
    ],
  },
  { label: "Admin & Settings", icon: <Settings size={17} />, path: "/admin" },
]

function NavGroup({ item: rawItem, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation()
  const { user } = useAuth()
  // Only Admins can activate projects.
  const item: NavItem = rawItem.children
    ? { ...rawItem, children: rawItem.children.filter((c) => c.path !== "/projects/activate" || user?.role === "Admin") }
    : rawItem
  const isAnyChildActive =
    item.children?.some((c) => location.pathname.startsWith(c.path)) ?? false
  const isEnd = (path: string) =>
    path === "/projects" || path === "/people-management"
  const [open, setOpen] = useState(isAnyChildActive)

  useEffect(() => {
    if (isAnyChildActive) setOpen(true)
  }, [isAnyChildActive])

  if (!item.children) {
    return (
      <NavLink
        to={item.path!}
        className={({ isActive }) =>
          `sidebar-nav-item ${isActive ? "active" : ""}`
        }
        title={collapsed ? item.label : undefined}
      >
        {item.icon}
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={collapsed ? item.label : undefined}
        className={`sidebar-nav-item w-full ${
          isAnyChildActive ? "active" : ""
        }`}
        title={collapsed ? item.label : undefined}
      >
        {item.icon}
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </>
        )}
      </button>
      {open && !collapsed && (
        <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-slate-700 pl-3">
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              end={isEnd(child.path)}
              className={({ isActive }) =>
                `sidebar-nav-item text-[13px] py-1.5 ${
                  isActive ? "active" : ""
                }`
              }
            >
              {child.icon}
              <span>{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState("")
  const { user, logout } = useAuth()
  const [theme, setTheme] = usePersistentState<"light" | "dark">(
    "ngo-theme",
    "light",
  )
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [reminderData, setReminderData] = useState<DashboardReminders | null>(
    null,
  )
  const [remindersLoading, setRemindersLoading] = useState(false)
  const [remindersError, setRemindersError] = useState("")
  const [readReminders, setReadReminders] = usePersistentState<string[]>(
    `ngo-read-reminders-${user?.id ?? "guest"}`,
    [],
  )
  const location = useLocation()
  const navigate = useNavigate()
  const headerActionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !headerActionsRef.current?.contains(event.target)
      ) {
        setProfileOpen(false)
        setNotificationsOpen(false)
      }
    }
    const closeMenusOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false)
        setNotificationsOpen(false)
      }
    }
    document.addEventListener("mousedown", closeMenus)
    document.addEventListener("keydown", closeMenusOnEscape)
    return () => {
      document.removeEventListener("mousedown", closeMenus)
      document.removeEventListener("keydown", closeMenusOnEscape)
    }
  }, [])

  const onLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  const loadReminders = async () => {
    setRemindersLoading(true)
    setRemindersError("")
    try {
      setReminderData(await apiRequest<DashboardReminders>("/dashboard/reminders"))
    } catch (error) {
      setRemindersError(
        error instanceof Error ? error.message : "Could not load reminders.",
      )
    } finally {
      setRemindersLoading(false)
    }
  }

  const reminders: Reminder[] = [
    ...(reminderData?.pendingTasks ?? []).map((task) => ({
      id: `task:${task.task}:${task.due}`,
      title: task.task,
      detail:
        task.due === "No due date"
          ? `${task.priority} priority · No due date`
          : `Due ${task.due} · ${task.priority} priority`,
      type: "task" as const,
      important: task.priority === "Critical" || task.priority === "High",
    })),
    ...(reminderData?.upcomingEvents ?? []).map((event) => ({
      id: `event:${event.title}:${event.date}`,
      title: event.title,
      detail: `${new Date(event.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}${
        event.location ? ` · ${event.location}` : ""
      }`,
      type: "event" as const,
      important: false,
    })),
  ]
  const unreadCount = reminders.filter(
    (reminder) => !readReminders.includes(reminder.id),
  ).length

  const toggleNotifications = () => {
    const willOpen = !notificationsOpen
    setNotificationsOpen(willOpen)
    setProfileOpen(false)
    if (willOpen && !reminderData && !remindersLoading) void loadReminders()
  }

  const markAllRead = () => {
    setReadReminders((current) =>
      Array.from(
        new Set([...current, ...reminders.map((reminder) => reminder.id)]),
      ),
    )
  }

  useEffect(() => {
    const handleNotice = (event: Event) => {
      const message = (event as CustomEvent<string>).detail
      setNotice(message)
      window.setTimeout(() => setNotice(""), 2800)
    }
    window.addEventListener("ngo:notify", handleNotice)
    return () => window.removeEventListener("ngo:notify", handleNotice)
  }, [])

  const currentTitle = (() => {
    if (location.pathname === "/projects/activate")
      return "Activate Project"
    if (
      location.pathname.startsWith("/projects/") &&
      !location.pathname.startsWith("/projects/activate")
    )
      return "Project Details"

    let best: { label: string; len: number } | null = null
    for (const item of navConfig) {
      if (item.path && location.pathname === item.path) return item.label
      for (const c of item.children ?? []) {
        if (
          location.pathname.startsWith(c.path) &&
          (!best || c.path.length > best.len)
        )
          best = { label: c.label, len: c.path.length }
      }
    }

    return best?.label ?? "Hope Foundation"
  })()

  return (
    <div
      className="app-shell flex h-screen overflow-hidden"
      style={{ background: "var(--app-background)" }}
    >
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 lg:z-auto h-full flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[60px]" : "w-[240px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          background: "#0C2337",
          boxShadow: "2px 0 20px rgba(0,0,0,0.15)",
        }}
      >
        {/* Logo */}
        <div
          className={`flex items-center justify-center px-3 py-3 border-b border-slate-700 ${
            collapsed ? "" : "min-h-[104px]"
          }`}
        >
          <img
            src={logoUrl}
            alt="Hope Foundation"
            className={`${
              collapsed ? "h-10 w-10" : "h-[80px] w-full max-w-[200px]"
            } flex-shrink-0 object-contain`}
          />
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex absolute -right-3 top-16 w-6 h-6 rounded-full items-center justify-center z-10 border border-slate-600"
          style={{ background: "#1AACB8", color: "#fff" }}
        >
          {collapsed ? (
            <ChevronRight size={12} />
          ) : (
            <ChevronDown size={12} style={{ transform: "rotate(90deg)" }} />
          )}
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
          {!collapsed && <span className="sidebar-group-label">Main Menu</span>}
          {navConfig.slice(0, 6).map((item) => (
            <NavGroup key={item.label} item={item} collapsed={collapsed} />
          ))}
          {!collapsed && <span className="sidebar-group-label">Programs</span>}
          {navConfig.slice(6, 8).map((item) => (
            <NavGroup key={item.label} item={item} collapsed={collapsed} />
          ))}
          {!collapsed && <span className="sidebar-group-label">Modules</span>}
          {navConfig.slice(8, -1).map((item) => (
            <NavGroup key={item.label} item={item} collapsed={collapsed} />
          ))}
          {!collapsed && <span className="sidebar-group-label">System</span>}
          {navConfig.slice(-1).map((item) => (
            <NavGroup key={item.label} item={item} collapsed={collapsed} />
          ))}
        </nav>

      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top header */}
        <header
          className="app-header flex items-center gap-3 px-5 py-3 border-b"
          style={{
            background: "var(--surface)",
            borderColor: "var(--surface-border)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="min-w-0 flex-1">
            <h1
              className="truncate text-base font-bold text-slate-800"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              {currentTitle}
            </h1>
            <p className="hidden truncate text-[11px] text-slate-400 sm:block">
              Hope Foundation NGO Management System
            </p>
          </div>

          <div
            ref={headerActionsRef}
            className="relative flex shrink-0 items-center gap-1 sm:gap-2"
          >
            <div className="relative hidden lg:block">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-teal-400 w-48"
              />
            </div>
            <span className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-medium text-slate-600 md:inline-flex">
              {user?.role}
            </span>
            <button
              type="button"
              onClick={toggleNotifications}
              aria-label={`Notifications${
                unreadCount ? `, ${unreadCount} unread` : ""
              }`}
              aria-expanded={notificationsOpen}
              className="header-icon-button relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="notification-count">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={`Switch to ${
                theme === "light" ? "dark" : "light"
              } mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              className="header-icon-button rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((open) => !open)
                setNotificationsOpen(false)
              }}
              aria-label="Open user profile"
              aria-expanded={profileOpen}
              className="profile-trigger flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: "#1AACB8" }}
            >
              <UserCircle size={19} className="text-white" />
            </button>

            {profileOpen && (
              <section
                className="header-popover profile-popover"
                aria-label="User profile"
              >
                <div className="profile-popover-cover" />
                <div className="profile-popover-content">
                  <div className="profile-avatar" aria-hidden="true">
                    {(user?.fullName ?? "U")
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <h2 className="profile-name">{user?.fullName || "User"}</h2>
                  <p className="profile-email">{user?.email}</p>
                  <div className="profile-role">{user?.role}</div>
                  <div className="profile-divider" />
                  <button
                    type="button"
                    onClick={() => void onLogout()}
                    className="profile-signout"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </section>
            )}

            {notificationsOpen && (
              <section
                className="header-popover notifications-popover"
                aria-label="Notifications and reminders"
              >
                <div className="popover-heading">
                  <div>
                    <h2>Notifications</h2>
                    <p>Important updates and reminders</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadReminders()}
                    aria-label="Refresh notifications"
                    className="popover-icon-button"
                    disabled={remindersLoading}
                  >
                    <RefreshCw
                      size={16}
                      className={remindersLoading ? "animate-spin" : ""}
                    />
                  </button>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="mark-read-button"
                  >
                    <Check size={14} /> Mark all as read
                  </button>
                )}
                <div className="notification-list">
                  {remindersLoading && !reminderData ? (
                    <p className="notification-state" role="status">
                      Loading reminders…
                    </p>
                  ) : remindersError ? (
                    <div className="notification-error" role="alert">
                      <AlertCircle size={18} />
                      <span>{remindersError}</span>
                      <button
                        type="button"
                        onClick={() => void loadReminders()}
                      >
                        Try again
                      </button>
                    </div>
                  ) : reminders.length ? (
                    reminders.map((reminder) => (
                      <button
                        type="button"
                        key={reminder.id}
                        className={`notification-item ${
                          readReminders.includes(reminder.id) ? "" : "unread"
                        }`}
                        onClick={() => {
                          setReadReminders((current) =>
                            current.includes(reminder.id)
                              ? current
                              : [...current, reminder.id],
                          )
                          setNotificationsOpen(false)
                          if (user?.role !== "Volunteer" && user?.role !== "Board") {
                            navigate(
                              reminder.type === "event"
                                ? "/events"
                                : "/projects/planning",
                            )
                          }
                        }}
                      >
                        <span
                          className={`notification-symbol ${
                            reminder.important ? "important" : ""
                          }`}
                        >
                          {reminder.type === "event" ? (
                            <CalendarDays size={17} />
                          ) : (
                            <CalendarClock size={17} />
                          )}
                        </span>
                        <span className="notification-copy">
                          <span className="notification-title">
                            {reminder.title}
                          </span>
                          <span className="notification-detail">
                            {reminder.detail}
                          </span>
                          <span className="notification-category">
                            {reminder.important
                              ? "Important task"
                              : reminder.type === "event"
                                ? "Upcoming event"
                                : "Task reminder"}
                          </span>
                        </span>
                        {!readReminders.includes(reminder.id) && (
                          <span className="notification-unread-dot" />
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="notification-state">
                      {reminderData
                        ? "You’re all caught up. No upcoming events or pending tasks."
                        : "No reminders to show."}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="notification-footer"
                  onClick={() => {
                    setNotificationsOpen(false)
                    navigate("/dashboard")
                  }}
                >
                  View dashboard
                </button>
              </section>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="app-content min-w-0 flex-1 overflow-y-auto p-5">
          {notice && (
            <div
              role="status"
              className="fixed right-5 top-20 z-[110] flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl"
            >
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              {notice}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
