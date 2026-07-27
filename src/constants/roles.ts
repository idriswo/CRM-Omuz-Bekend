export const ROLES = {
  STUDENT: "student",
  // Пеш "admin" ном дошт (2026-07-27 иваз шуд). Диққат: ин нақши ВУРУД аст ва
  // бо Employee.position = "Mentor" ва модели MentorLevel алоқаманд нест —
  // онҳо маълумоти кадрӣ мебошанд, на ҳуқуқи дастрасӣ.
  MENTOR: "mentor",
  SUPERADMIN: "superadmin",
  DIRECTOR: "director",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

// Нақшҳое, ки ҳар нақш ҳуқуқ дорад сабт/нест кунад (тибқи иерархияи корбар)
export const ROLE_CREATE_MATRIX: Record<string, RoleName[]> = {
  [ROLES.DIRECTOR]: [ROLES.SUPERADMIN, ROLES.MENTOR, ROLES.STUDENT],
  [ROLES.SUPERADMIN]: [ROLES.MENTOR, ROLES.STUDENT],
};

export const STAFF_ROLES: RoleName[] = [ROLES.MENTOR, ROLES.SUPERADMIN, ROLES.DIRECTOR];
export const FINANCE_ROLES: RoleName[] = [ROLES.DIRECTOR];
export const USER_MANAGEMENT_ROLES: RoleName[] = [ROLES.SUPERADMIN, ROLES.DIRECTOR];
