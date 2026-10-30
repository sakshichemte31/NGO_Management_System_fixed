import { useCallback, useEffect, useState } from "react"
import { Settings, Users, Shield, Database, Key, RefreshCw } from "lucide-react"
import { useToast } from "../../components/projects/Toast"
import { useAuth } from "../../context/AuthContext"
import {
  ADMIN_ROLES,
  getManagedUsers,
  updateManagedUserRole,
  type AdminRole,
  type ManagedUser,
} from "../../services/adminApi"

const roles = [
  {
    name: "Admin",
    description: "Full visibility: approves proposals, activates projects, manages users and system settings.",
  },
  {
    name: "Project Manager",
    description: "Creates proposals, builds detailed plans, and views active projects (read-only).",
  },
  {
    name: "Staff",
    description: "Read operational records and make permitted updates.",
  },
  {
    name: "Volunteer",
    description:
      "Use volunteer workflows without general operational data access.",
  },
  {
    name: "Board",
    description:
      "Use board-facing experiences without general operational data access.",
  },
]

const auditLogs = [
  {
    user: "Rahul Mehta",
    action: "Exported donor database",
    module: "Donors",
    time: "7 Oct, 11:32 AM",
    ip: "192.168.1.102",
    risk: "Medium",
  },
  {
    user: "Priya Sharma",
    action: "Approved project proposal PP-2025-010",
    module: "Projects",
    time: "7 Oct, 10:15 AM",
    ip: "192.168.1.105",
    risk: "Low",
  },
  {
    user: "Admin",
    action: "Created new user: Deepika Rao",
    module: "Admin",
    time: "5 Oct, 3:20 PM",
    ip: "192.168.1.100",
    risk: "Low",
  },
  {
    user: "Amit Kumar",
    action: "Deleted budget entry BUD-2025-042",
    module: "Resources",
    time: "4 Oct, 2:45 PM",
    ip: "192.168.1.108",
    risk: "High",
  },
]

const riskStyle: Record<string, string> = {
  Low: "badge badge-green",
  Medium: "badge badge-yellow",
  High: "badge badge-red",
}

const systemSettings = [
  {
    category: "Donor Categories",
    description: "Individual, Corporate, Organisation, Partner, Advisor",
  },
  {
    category: "Contribution Types",
    description: "Cash, Cheque, NEFT, UPI, Material, Time",
  },
  {
    category: "Campaign Settings",
    description: "Campaign duration, goal tracking, matching rules",
  },
  {
    category: "Notification Settings",
    description: "Email alerts, WhatsApp, in-app notifications",
  },
  {
    category: "Communication Settings",
    description: "Email templates, reply-to, SMTP config",
  },
  {
    category: "User Permissions",
    description: "Role-based access control (RBAC) configuration",
  },
  {
    category: "Data / Export Settings",
    description: "Data retention, export formats, backup schedule",
  },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [draftRoles, setDraftRoles] = useState<Record<string, AdminRole>>({})
  const [usersLoading, setUsersLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [usersError, setUsersError] = useState("")
  const { user: signedInUser } = useAuth()
  const toast = useToast()

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    setUsersError("")
    try {
      const managedUsers = await getManagedUsers()
      setUsers(managedUsers)
      setDraftRoles(
        Object.fromEntries(managedUsers.map((user) => [user.id, user.role])),
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load user accounts."
      setUsersError(message)
      toast.error(message)
    } finally {
      setUsersLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const saveRole = async (user: ManagedUser) => {
    const role = draftRoles[user.id]
    if (!role || role === user.role) return
    setSavingUserId(user.id)
    try {
      const updatedUser = await updateManagedUserRole(user.id, role)
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? updatedUser : item)),
      )
      setDraftRoles((current) => ({ ...current, [user.id]: updatedUser.role }))
      toast.success(`${user.fullName}'s role is now ${updatedUser.role}.`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update this user’s role.",
      )
    } finally {
      setSavingUserId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Admin & Settings</h1>
          <p className="page-subtitle">
            User management, access control, audit logs, and system
            configuration
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => void loadUsers()}
          disabled={usersLoading || savingUserId !== null}
        >
          <RefreshCw size={15} className={usersLoading ? "animate-spin" : ""} />{" "}
          Refresh users
        </button>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Users",
            value: usersLoading ? "…" : String(users.length),
            icon: <Users size={18} />,
            color: "#1AACB8",
          },
          {
            label: "Available Roles",
            value: String(ADMIN_ROLES.length),
            icon: <Shield size={18} />,
            color: "#6366F1",
          },
          {
            label: "Audit Events (Today)",
            value: "28",
            icon: <Database size={18} />,
            color: "#F59E0B",
          },
          {
            label: "Security Alerts",
            value: "2",
            icon: <Key size={18} />,
            color: "#EF4444",
          },
        ].map((s) => (
          <div key={s.label} className="stat-card flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{ background: s.color + "15" }}
            >
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div
                className="text-xl font-extrabold text-slate-800"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                {s.value}
              </div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="tab-bar w-fit">
        {["users", "roles", "audit", "settings"].map((t) => (
          <button
            key={t}
            className={`tab-item capitalize ${activeTab === t ? "active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <span className="card-title">Office account access</span>
              <p className="mt-1 text-xs text-slate-500">
                Select a role and save the change to update an account’s access.
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {users.length} accounts
            </span>
          </div>
          {usersError ? (
            <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p>{usersError}</p>
              <button
                type="button"
                className="mt-2 font-semibold underline"
                onClick={() => void loadUsers()}
              >
                Try again
              </button>
            </div>
          ) : usersLoading ? (
            <div
              className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"
              role="status"
            >
              <RefreshCw size={16} className="animate-spin" /> Loading office
              accounts…
            </div>
          ) : users.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No registered accounts yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Office user</th>
                    <th>Current role</th>
                    <th>Change role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((account) => {
                    const isSelf = account.id === signedInUser?.id
                    const hasRoleChange =
                      draftRoles[account.id] !== account.role
                    return (
                      <tr key={account.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                              style={{ background: "#1AACB8" }}
                            >
                              {account.fullName.trim().charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-800">
                                {account.fullName}
                              </div>
                              <div className="text-xs text-slate-500">
                                {account.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-teal">
                            {account.role}
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-input min-w-40"
                            aria-label={`Role for ${account.fullName}`}
                            value={draftRoles[account.id] ?? account.role}
                            disabled={isSelf || savingUserId !== null}
                            onChange={(event) => {
                              const role = ADMIN_ROLES.find(
                                (option) => option === event.target.value,
                              )
                              if (role)
                                setDraftRoles((current) => ({
                                  ...current,
                                  [account.id]: role,
                                }))
                            }}
                          >
                            {ADMIN_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          {isSelf && (
                            <p className="mt-1 text-xs text-slate-400">
                              Ask another admin to change your role.
                            </p>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-primary min-w-24 justify-center py-1.5 text-xs"
                            disabled={
                              !hasRoleChange || isSelf || savingUserId !== null
                            }
                            onClick={() => void saveRole(account)}
                          >
                            {savingUserId === account.id
                              ? "Saving…"
                              : "Save role"}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.name}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="card-body flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={16} style={{ color: "#1AACB8" }} />
                    <span
                      className="font-bold text-slate-800"
                      style={{ fontFamily: "Nunito, sans-serif" }}
                    >
                      {role.name}
                    </span>
                  </div>
                  <span className="badge badge-teal">
                    {users.filter((user) => user.role === role.name).length}{" "}
                    users
                  </span>
                </div>
                <p className="text-xs leading-5 text-slate-600">
                  {role.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "audit" && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <span className="card-title">Audit Logs</span>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs py-1">Filter</button>
              <button className="btn-secondary text-xs py-1">Export</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Time</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, i) => (
                  <tr key={i}>
                    <td className="font-semibold text-slate-800">{log.user}</td>
                    <td className="text-sm text-slate-600">{log.action}</td>
                    <td>
                      <span className="badge badge-blue">{log.module}</span>
                    </td>
                    <td className="text-xs text-slate-400">{log.time}</td>
                    <td>
                      <span className={riskStyle[log.risk]}>{log.risk}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemSettings.map((s, i) => (
            <div key={i} className="card hover:shadow-md transition-shadow">
              <div className="card-body flex items-center gap-4">
                <div
                  className="p-2.5 rounded-xl"
                  style={{ background: "#E6F7F9" }}
                >
                  <Settings size={16} style={{ color: "#1AACB8" }} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-800 text-sm">
                    {s.category}
                  </div>
                  <div className="text-xs text-slate-500">{s.description}</div>
                </div>
                <button
                  type="button"
                  className="btn-secondary text-xs py-1.5"
                  onClick={() => setActiveTab("users")}
                  aria-label={
                    s.category === "User Permissions"
                      ? "Manage user roles"
                      : `Configure ${s.category}`
                  }
                >
                  {s.category === "User Permissions"
                    ? "Manage roles"
                    : "Configure"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
