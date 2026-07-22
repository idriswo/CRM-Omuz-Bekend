import { format } from "date-fns";

/** "Apr 9, 2023" — форматест, ки фронтенд бевосита нишон медиҳад. */
export const fmtDate = (d?: Date | null) => (d ? format(d, "MMM d, yyyy") : "");

/** "Apr 9, 2023 - Aug 10, 2023" */
export const fmtPeriod = (start?: Date | null, end?: Date | null) =>
  start || end ? `${fmtDate(start)} - ${fmtDate(end)}` : "";

export const ageFrom = (birth?: Date | null) => {
  if (!birth) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

export const fullName = (s: { first_name?: string | null; last_name?: string | null }) =>
  `${s.last_name ?? ""} ${s.first_name ?? ""}`.trim();

export type ContractStatus = "active" | "10_day_left" | "finished";

/** Аз санаи охирини шартнома: гузашт → finished, то 10 рӯз мондааст → 10_day_left, вагарна active. */
export const contractStatus = (contracts?: { end_date: Date }[] | null): ContractStatus => {
  if (!contracts || contracts.length === 0) return "active";
  const latest = contracts.reduce((a, b) => (a.end_date > b.end_date ? a : b));
  const now = new Date();
  const in10 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  if (latest.end_date < now) return "finished";
  if (latest.end_date <= in10) return "10_day_left";
  return "active";
};

/** phones дар DB Json аст; ҳамеша массиви {label, number} бармегардонем. */
export const phonesOf = (student: any) => {
  const raw = student.phones;
  if (Array.isArray(raw) && raw.length) return raw;
  const fallback: { label: string; number: string }[] = [];
  if (student.phone) fallback.push({ label: "Student", number: student.phone });
  if (student.father_phone) fallback.push({ label: "Father", number: student.father_phone });
  return fallback;
};

/** Донишҷӯ дар шакле, ки интерфейси `Student`-и фронтенд интизор аст. */
export const studentDto = (s: any) => ({
  id: s.id,
  full_name: fullName(s),
  first_name: s.first_name,
  last_name: s.last_name,
  birth_date: s.birth_date ? format(s.birth_date, "yyyy-MM-dd") : "",
  age: ageFrom(s.birth_date),
  gender: s.gender,
  address: s.address ?? "",
  email: s.email ?? "",
  phone: s.phone ?? "",
  father_phone: s.father_phone ?? "",
  phones: phonesOf(s),
  groups: (s.groups ?? []).map((g: any) => ({
    id: g.id,
    name: g.name,
    period: fmtPeriod(g.start_date, g.end_date),
  })),
  status: s.status,
  has_account: Boolean(s.user),
  contract_status: contractStatus(s.contracts),
  is_top: Boolean(s.is_top),
  branch_id: s.branch_id ?? null,
  telegram_username: s.telegram_username ?? "",
  description: s.description ?? "",
  photo: s.photo ?? null,
  coin_balance: s.coin_balance ?? 0,
});

/** include-и стандартӣ барои ҳамаи ҷойҳое, ки studentDto истифода мешавад. */
export const studentInclude = {
  contracts: true,
  groups: true,
  user: { select: { id: true } },
} as const;

const WEEKDAY_ORDER = ["Mn", "Tu", "Wd", "Th", "Fr", "Sa", "Su"];

/** "Mn, Tu, Wd" ва "16:00 - 18:00" аз slot-ҳои ҷадвал. */
export const scheduleSummary = (slots: any[] = []) => {
  const sorted = [...slots].sort(
    (a, b) => WEEKDAY_ORDER.indexOf(a.weekday) - WEEKDAY_ORDER.indexOf(b.weekday)
  );
  const days = sorted.map((s) => s.weekday).join(", ");
  const first = sorted[0];
  return { days, time: first ? `${first.start} - ${first.end}` : "" };
};

const GROUP_STATUS_MAP: Record<string, string> = {
  active: "Started",
  started: "Started",
  pending: "Pending",
  finished: "Finished",
};

export const groupStatus = (raw?: string | null) =>
  GROUP_STATUS_MAP[String(raw ?? "").toLowerCase()] ?? "Started";

/** status-и воридотӣ (Started/Pending/Finished) → шакли DB. */
export const groupStatusToDb = (raw?: string | null) => {
  const v = String(raw ?? "").toLowerCase();
  if (!v) return undefined;
  if (v === "started" || v === "active") return "active";
  if (v === "pending") return "pending";
  if (v === "finished") return "finished";
  return v;
};

export const mentorName = (e: any) => `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim();

/** Гурӯҳ дар шакли интерфейси `Group`-и фронтенд. */
export const groupDto = (g: any) => {
  const { days, time } = scheduleSummary(g.schedule_slots ?? []);
  const students = g.students ?? [];
  return {
    id: g.id,
    name: g.name,
    course: g.course?.name ?? "",
    course_id: g.course_id,
    start_date: fmtDate(g.start_date),
    end_date: fmtDate(g.end_date),
    duration: g.duration ?? "",
    duration_type: g.duration_type ?? "",
    required_students: g.required_students ?? 0,
    passing_students: students.filter((s: any) => s.status !== "inactive").length,
    capacity: g.capacity ?? g.required_students ?? 0,
    days,
    time,
    branch: g.branch?.title ?? "",
    branch_id: g.branch_id,
    status: groupStatus(g.status),
    tag: g.tag ?? null,
    format: g.format ?? "",
    telegram_link: g.telegram_link ?? "",
    description: g.description ?? "",
  };
};

export const groupStudentDto = (s: any) => ({
  id: s.id,
  full_name: fullName(s),
  phone: s.phone ?? "",
  father_phone: s.father_phone ?? "",
  has_account: Boolean(s.user),
  status: s.status === "inactive" ? "Inactive" : "Active",
});

export const groupLeftStudentDto = (s: any) => ({
  id: s.id,
  full_name: fullName(s),
  phone: s.phone ?? "",
  has_account: Boolean(s.user),
  reason: s.left_reason ?? "",
});
