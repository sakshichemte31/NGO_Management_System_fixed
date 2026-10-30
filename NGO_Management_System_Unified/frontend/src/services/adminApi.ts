import { apiRequest } from "./apiClient"

export const ADMIN_ROLES = [
  "Admin",
  "Project Manager",
  "Staff",
  "Volunteer",
  "Board",
] as const

export type AdminRole = typeof ADMIN_ROLES[number]

export interface ManagedUser {
  id: string

  fullName: string

  email: string

  role: AdminRole
}

export function getManagedUsers(): Promise<ManagedUser[]> {
  return apiRequest<ManagedUser[]>("/admin/users")
}

export function updateManagedUserRole(
  userId: string,
  role: AdminRole,
): Promise<ManagedUser> {
  return apiRequest<ManagedUser>(
    `/admin/users/${encodeURIComponent(userId)}/role`,
    {
      method: "PATCH",

      body: JSON.stringify({ role }),
    },
  )
}
