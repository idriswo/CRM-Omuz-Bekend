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

/**
 * Гурӯҳҳои дастрасӣ. Ҳар route яке аз инҳоро истифода мебарад —
 * то ҳудуди ҳар нақш дар як ҷо дида шавад, на дар 13 файл пароканда.
 *
 *   director   — ҳама ҷо, аз ҷумла ойлик
 *   superadmin — ҳама ҷо ба ҷуз ойлик (salary/avans/accountant)
 *   mentor     — муаллим: журнал (ҳасту нест, балл), coin, дидани гурӯҳ/донишҷӯ
 *   student    — танҳо дидан: гурӯҳҳо, профил/балл/coin-и худаш
 */

/** Идоракунии контент: филиал, курс, лид, корманд, ҷадвал, dashboard, email */
export const MANAGEMENT_ROLES: RoleName[] = [ROLES.SUPERADMIN, ROLES.DIRECTOR];

/** Идоракунии корбарон ва нақшҳо */
export const USER_MANAGEMENT_ROLES: RoleName[] = [ROLES.SUPERADMIN, ROLES.DIRECTOR];

/** Молия ба ҷуз ойлик: payments, budget, debtors, expenses, overview */
export const FINANCE_ROLES: RoleName[] = [ROLES.SUPERADMIN, ROLES.DIRECTOR];

/** Ойлик ва аванс — танҳо director */
export const SALARY_ROLES: RoleName[] = [ROLES.DIRECTOR];

/** Кор бо донишҷӯ ва гурӯҳ: mentor низ дохил мешавад */
export const TEACHING_ROLES: RoleName[] = [ROLES.MENTOR, ROLES.SUPERADMIN, ROLES.DIRECTOR];

/** Сохтан/тағйир/нест кардани донишҷӯ — mentor иҷозат надорад */
export const STUDENT_WRITE_ROLES: RoleName[] = [ROLES.SUPERADMIN, ROLES.DIRECTOR];

/** Дидани гурӯҳҳо — донишҷӯ низ ҳамаи гурӯҳҳоро мебинад */
export const GROUP_READ_ROLES: RoleName[] = [
  ROLES.STUDENT,
  ROLES.MENTOR,
  ROLES.SUPERADMIN,
  ROLES.DIRECTOR,
];
