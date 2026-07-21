export const ROLES = {
  STUDENT: "student",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
  DIRECTOR: "director",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

// Нақшҳое, ки ҳар нақш ҳуқуқ дорад сабт/нест кунад (тибқи иерархияи корбар)
export const ROLE_CREATE_MATRIX: Record<string, RoleName[]> = {
  [ROLES.DIRECTOR]: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.STUDENT],
  [ROLES.SUPERADMIN]: [ROLES.ADMIN, ROLES.STUDENT],
};

export const STAFF_ROLES: RoleName[] = [ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DIRECTOR];
export const FINANCE_ROLES: RoleName[] = [ROLES.SUPERADMIN, ROLES.DIRECTOR];
export const USER_MANAGEMENT_ROLES: RoleName[] = [ROLES.SUPERADMIN, ROLES.DIRECTOR];
