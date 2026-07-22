import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";
import {
  groupDto,
  groupStatusToDb,
  groupStudentDto,
  groupLeftStudentDto,
  mentorName,
  fullName,
} from "../../utils/serialize";
import { syncJournalSafe, syncJournalToSheet, extractSheetId, sheetsEnabled } from "../../utils/googleSheets";

/** Ҳамаи маълумоте, ки барои groupDto лозим аст. */
const groupInclude = {
  course: true,
  branch: true,
  schedule_slots: true,
  students: { select: { id: true, status: true } },
} as const;

export const getGroups = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const { search, course_id, branch_id, status, tag } = req.query;

  const where: any = {};
  if (search) where.name = { contains: String(search), mode: "insensitive" };
  if (course_id) where.course_id = Number(course_id);
  if (branch_id) where.branch_id = Number(branch_id);
  if (status) where.status = groupStatusToDb(String(status));
  if (tag) where.tag = tag;

  const orderBy = ["id", "name", "start_date", "end_date", "created_at"].includes(String(sort_by))
    ? { [String(sort_by)]: sort_dir }
    : { id: sort_dir };

  const [data, total] = await Promise.all([
    prisma.group.findMany({ where, skip, take: limit, orderBy, include: groupInclude }),
    prisma.group.count({ where }),
  ]);

  res.json(buildEnvelope(data.map(groupDto), total, page, limit));
};

export const getGroupById = async (req: Request, res: Response) => {
  const group = await prisma.group.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      course: true,
      branch: true,
      schedule_slots: true,
      mentors: true,
      students: { include: { user: { select: { id: true } } } },
    },
  });
  if (!group) return res.status(404).json({ message: "Гурӯҳ ёфт нашуд" });

  res.json({
    ...groupDto(group),
    mentors: group.mentors.map(mentorName),
    students: group.students.filter((s) => s.status !== "inactive").map(groupStudentDto),
    left_course: group.students.filter((s) => s.status === "inactive").map(groupLeftStudentDto),
  });
};

/** Майдонҳои body-и гурӯҳ (ҳам барои create, ҳам update). */
function groupBody(req: Request, isCreate: boolean) {
  const b = req.body ?? {};
  return {
    name: b.name,
    course_id: b.course_id ? Number(b.course_id) : isCreate ? undefined : undefined,
    start_date: b.start_date ? new Date(b.start_date) : undefined,
    end_date: b.end_date ? new Date(b.end_date) : undefined,
    duration: b.duration,
    duration_type: b.duration_type,
    required_students: b.required_students !== undefined ? Number(b.required_students) : undefined,
    capacity: b.capacity !== undefined ? Number(b.capacity) : undefined,
    branch_id: b.branch_id ? Number(b.branch_id) : undefined,
    status: groupStatusToDb(b.status),
    tag: b.tag,
    description: b.description,
    format: b.format,
    telegram_link: b.telegram_link,
  };
}

export const createGroup = async (req: Request, res: Response) => {
  const b = groupBody(req, true);
  const mentor_ids: number[] = Array.isArray(req.body?.mentor_ids) ? req.body.mentor_ids.map(Number) : [];

  if (!b.name || !b.course_id || !b.branch_id)
    return res.status(400).json({ message: "name, course_id ва branch_id ҳатмист" });

  const created = await prisma.group.create({
    data: {
      name: b.name,
      course_id: b.course_id,
      start_date: b.start_date ?? new Date(),
      end_date: b.end_date ?? new Date(),
      duration: b.duration ?? "",
      duration_type: b.duration_type,
      required_students: b.required_students ?? 0,
      capacity: b.capacity,
      branch_id: b.branch_id,
      status: b.status ?? "active",
      tag: b.tag,
      description: b.description,
      format: b.format,
      telegram_link: b.telegram_link,
      ...(mentor_ids.length ? { mentors: { connect: mentor_ids.map((id) => ({ id })) } } : {}),
    },
    include: groupInclude,
  });

  res.status(201).json(groupDto(created));
};

export const updateGroup = async (req: Request, res: Response) => {
  const b = groupBody(req, false);
  const mentor_ids: number[] | undefined = Array.isArray(req.body?.mentor_ids)
    ? req.body.mentor_ids.map(Number)
    : undefined;

  const group = await prisma.group.update({
    where: { id: Number(req.params.id) },
    data: {
      ...b,
      ...(mentor_ids ? { mentors: { set: mentor_ids.map((id) => ({ id })) } } : {}),
    },
    include: groupInclude,
  });
  res.json(groupDto(group));
};

export const deleteGroup = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const weeks = await prisma.journalWeek.findMany({ where: { group_id: id }, select: { id: true } });

  // Вобастагиҳо аввал тоза мешаванд, вагарна FK иҷозат намедиҳад
  await prisma.$transaction([
    prisma.journalEntry.deleteMany({ where: { week_id: { in: weeks.map((w) => w.id) } } }),
    prisma.journalWeek.deleteMany({ where: { group_id: id } }),
    prisma.groupScheduleSlot.deleteMany({ where: { group_id: id } }),
    prisma.timetableEntry.updateMany({ where: { group_id: id }, data: { group_id: null } }),
    prisma.payment.deleteMany({ where: { group_id: id } }),
    prisma.group.update({ where: { id }, data: { students: { set: [] }, mentors: { set: [] } } }),
    prisma.group.delete({ where: { id } }),
  ]);
  res.json({ success: true });
};

/** Ранги ҳар tag — фронтенд онро бевосита истифода мебарад. */
const TAG_COLORS: Record<string, string> = {
  "Black list": "#f5222d",
  Kettle: "#fa8c16",
  Advanced: "#52c41a",
  Handsome: "#1677ff",
  ChatGPT: "#722ed1",
};

export const getGroupsStats = async (_req: Request, res: Response) => {
  const rows = await prisma.group.groupBy({ by: ["tag"], _count: { _all: true } });
  const counts = new Map(rows.filter((r) => r.tag).map((r) => [r.tag as string, r._count._all]));

  const known = Object.keys(TAG_COLORS).map((label) => ({
    label,
    count: counts.get(label) ?? 0,
    color: TAG_COLORS[label],
  }));
  // tag-ҳои ғайристандартӣ низ нишон дода мешаванд
  const extra = [...counts.keys()]
    .filter((t) => !(t in TAG_COLORS))
    .map((label) => ({ label, count: counts.get(label) ?? 0, color: "#8c8c8c" }));

  res.json({ data: [...known, ...extra] });
};

// ===== Journal =====
// Фронтенд санаро дар шакли "01.11.22" мефиристад ва ҳамон шаклро интизор аст,
// вале дар DB DateTime нигоҳ дошта мешавад (dashboard/activity аз он ҳисоб мекунанд).

const parseJournalDate = (raw: string): Date => {
  const m = String(raw).match(/^(\d{2})\.(\d{2})\.(\d{2,4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    return new Date(Date.UTC(year, Number(mo) - 1, Number(d)));
  }
  return new Date(raw);
};

const fmtJournalDate = (d: Date) =>
  `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${String(
    d.getUTCFullYear()
  ).slice(2)}`;

const sameDay = (a: Date, b: Date) => a.getTime() === b.getTime();

/** :weekId дар фронтенд week_number аст; барои эҳтиёт бо id низ ҷустуҷӯ мешавад. */
async function resolveWeek(groupId: number, weekParam: number) {
  return (
    (await prisma.journalWeek.findFirst({ where: { group_id: groupId, week_number: weekParam } })) ??
    (await prisma.journalWeek.findFirst({ where: { group_id: groupId, id: weekParam } }))
  );
}

const weekDto = (week: any, students: any[]) => ({
  week_id: week.id,
  week_number: week.week_number,
  dates: week.dates.map(fmtJournalDate),
  students: students.map((student) => {
    const mine = week.entries.filter((e: any) => e.student_id === student.id);
    const days = week.dates.map((date: Date) => {
      const entry = mine.find((e: any) => sameDay(e.day_date, date));
      return {
        date: fmtJournalDate(date),
        attendance: entry?.attendance ?? false,
        score: entry?.score ?? null,
        comment: entry?.comment ?? "",
        late: entry?.late ?? 0,
      };
    });
    const bonus = mine.find((e: any) => e.bonus != null)?.bonus ?? 0;
    const exam = mine.find((e: any) => e.exam != null)?.exam ?? 0;
    const scoreSum = days.reduce((acc: number, d: any) => acc + (d.score ?? 0), 0);
    return {
      student_id: student.id,
      full_name: fullName(student),
      days,
      bonus,
      exam,
      sum: scoreSum + bonus + exam,
    };
  }),
});

export const getGroupJournal = async (req: Request, res: Response) => {
  const groupId = Number(req.params.id);

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      students: { where: { status: { not: "inactive" } } },
      weeks: { include: { entries: true }, orderBy: { week_number: "desc" } },
    },
  });
  if (!group) return res.status(404).json({ message: "Гурӯҳ ёфт нашуд" });

  const weeks = group.weeks.map((w) => weekDto(w, group.students));

  // Диаграмма: миёнаи бали ҳар донишҷӯ дар ҳар ҳафта + сутуни "Avarage"
  const series = group.students.slice(0, 6);
  const ordered = [...weeks].sort((a, b) => a.week_number - b.week_number);
  const chart: Record<string, string | number>[] = ordered.map((w) => {
    const point: Record<string, string | number> = { week: `Week ${w.week_number}` };
    for (const s of series) {
      const row = w.students.find((r) => r.student_id === s.id);
      const scores: number[] = (row?.days ?? []).map((d: any) => Number(d.score ?? 0));
      point[fullName(s)] = scores.length
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : 0;
    }
    return point;
  });
  if (chart.length) {
    const avg: Record<string, string | number> = { week: "Avarage" };
    for (const s of series) {
      const name = fullName(s);
      const values = chart.map((p) => Number(p[name] ?? 0));
      avg[name] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }
    chart.push(avg);
  }

  res.json({
    group_id: group.id,
    group_name: group.name,
    weeks,
    chart,
    students: series.map((s) => ({ id: s.id, name: fullName(s) })),
    sheet_url: group.sheet_url ?? null,
    sheets_sync: sheetsEnabled(),
  });
};

/** Нигоҳ доштани линки Google Sheets-и ин гурӯҳ + якбора синхронизатсия. */
export const setJournalSheet = async (req: Request, res: Response) => {
  const groupId = Number(req.params.id);
  const url = req.body?.sheet_url ?? req.body?.url ?? null;

  const group = await prisma.group.update({
    where: { id: groupId },
    data: { sheet_url: url, sheet_id: extractSheetId(url) },
    select: { sheet_url: true, sheet_id: true },
  });

  const result = url ? await syncJournalToSheet(groupId) : { skipped: "линк тоза шуд" };
  res.json({ success: true, ...group, sync: result });
};

/** Дастӣ фиристодани журнал ба Google Sheets (тугмаи «Sync»). */
export const syncJournalSheet = async (req: Request, res: Response) => {
  const result = await syncJournalToSheet(Number(req.params.id));
  res.json({ success: !("skipped" in result), ...result });
};

export const addJournalWeek = async (req: Request, res: Response) => {
  const groupId = Number(req.params.id);
  const { week_number, dates } = req.body ?? {};

  const last = await prisma.journalWeek.findFirst({
    where: { group_id: groupId },
    orderBy: { week_number: "desc" },
  });

  const week = await prisma.journalWeek.create({
    data: {
      group_id: groupId,
      week_number: Number(week_number) || (last?.week_number ?? 0) + 1,
      dates: ((dates as string[]) ?? []).map(parseJournalDate),
    },
    include: { entries: true },
  });

  const students = await prisma.student.findMany({
    where: { groups: { some: { id: groupId } }, status: { not: "inactive" } },
  });
  syncJournalSafe(groupId);
  res.status(201).json(weekDto(week, students));
};

/** Илова кардани санаи нав ба ҳафта. */
export const addJournalDate = async (req: Request, res: Response) => {
  const groupId = Number(req.params.id);
  const week = await resolveWeek(groupId, Number(req.params.weekId));
  if (!week) return res.status(404).json({ message: "Ҳафта ёфт нашуд" });

  const date = parseJournalDate(req.body?.date);
  if (week.dates.some((d) => sameDay(d, date)))
    return res.status(409).json({ message: "Ин сана аллакай ҳаст" });

  await prisma.journalWeek.update({
    where: { id: week.id },
    data: { dates: { set: [...week.dates, date].sort((a, b) => a.getTime() - b.getTime()) } },
  });
  syncJournalSafe(groupId);
  res.status(201).json({ success: true });
};

/** Иваз кардани санаи index-ум (сабтҳои он рӯз низ кӯчонида мешаванд). */
export const updateJournalDate = async (req: Request, res: Response) => {
  const groupId = Number(req.params.id);
  const index = Number(req.params.index);
  const week = await resolveWeek(groupId, Number(req.params.weekId));
  if (!week || !week.dates[index]) return res.status(404).json({ message: "Сана ёфт нашуд" });

  const oldDate = week.dates[index];
  const newDate = parseJournalDate(req.body?.date);
  const dates = [...week.dates];
  dates[index] = newDate;

  await prisma.$transaction([
    prisma.journalEntry.updateMany({
      where: { week_id: week.id, day_date: oldDate },
      data: { day_date: newDate },
    }),
    prisma.journalWeek.update({ where: { id: week.id }, data: { dates: { set: dates } } }),
  ]);
  syncJournalSafe(groupId);
  res.json({ success: true });
};

export const deleteJournalDate = async (req: Request, res: Response) => {
  const groupId = Number(req.params.id);
  const index = Number(req.params.index);
  const week = await resolveWeek(groupId, Number(req.params.weekId));
  if (!week || !week.dates[index]) return res.status(404).json({ message: "Сана ёфт нашуд" });

  const removed = week.dates[index];
  await prisma.$transaction([
    prisma.journalEntry.deleteMany({ where: { week_id: week.id, day_date: removed } }),
    prisma.journalWeek.update({
      where: { id: week.id },
      data: { dates: { set: week.dates.filter((_, i) => i !== index) } },
    }),
  ]);
  syncJournalSafe(groupId);
  res.json({ success: true });
};

export const deleteJournalWeek = async (req: Request, res: Response) => {
  const groupId = Number(req.params.id);
  const week = await resolveWeek(groupId, Number(req.params.weekId));
  if (!week) return res.status(404).json({ message: "Ҳафта ёфт нашуд" });

  await prisma.$transaction([
    prisma.journalEntry.deleteMany({ where: { week_id: week.id } }),
    prisma.journalWeek.delete({ where: { id: week.id } }),
  ]);
  syncJournalSafe(groupId);
  res.json({ success: true });
};

const WEEKLY_COIN_AMOUNT = 10;
const WEEKLY_COIN_MIN_AVG_SCORE = 90;

// Агар донишҷӯ дар ин ҳафта ба ҳамаи рӯзҳо ҳозир шуда бошад (attendance=true барои ҳама санаҳо)
// ва миёнаи баллаш аз 90 бештар бошад — 10 coin худкор дода мешавад (як бор барои ҳар ҳафта).
async function maybeAwardWeeklyCoins(weekId: number, studentId: number) {
  const week = await prisma.journalWeek.findUnique({
    where: { id: weekId },
    include: { entries: { where: { student_id: studentId } } },
  });
  if (!week || week.dates.length === 0) return;
  if (week.entries.length < week.dates.length) return; // ҳанӯз пур нашудааст
  if (!week.entries.every((e) => e.attendance)) return; // ҳама рӯз ҳозир набудааст

  const scores = week.entries.map((e) => e.score ?? 0);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avgScore <= WEEKLY_COIN_MIN_AVG_SCORE) return;

  const reason = `Ҳафтаи ${week.week_number} — давомоти пурра + миёнаи бали ${avgScore.toFixed(1)}`;
  const already = await prisma.coinTransaction.findFirst({
    where: { student_id: studentId, type: "auto_weekly", reason },
  });
  if (already) return; // қаблан дода шудааст

  await prisma.$transaction([
    prisma.coinTransaction.create({
      data: { student_id: studentId, amount: WEEKLY_COIN_AMOUNT, type: "auto_weekly", reason },
    }),
    prisma.student.update({ where: { id: studentId }, data: { coin_balance: { increment: WEEKLY_COIN_AMOUNT } } }),
  ]);
}

export const upsertJournalEntry = async (req: Request, res: Response) => {
  const groupId = Number(req.params.id);
  const studentId = Number(req.params.studentId);
  const { day_date, attendance, score, bonus, exam, comment, late } = req.body ?? {};

  const week = await resolveWeek(groupId, Number(req.params.weekId));
  if (!week) return res.status(404).json({ message: "Ҳафта ёфт нашуд" });

  // Агар day_date наомада бошад (танҳо bonus/exam), рӯзи аввали ҳафта гирифта мешавад
  const dayDate = day_date ? parseJournalDate(day_date) : week.dates[0];
  if (!dayDate) return res.status(400).json({ message: "day_date ҳатмист" });

  const data = { attendance, score, bonus, exam, comment, late };
  const entry = await prisma.journalEntry.upsert({
    where: {
      week_id_student_id_day_date: { week_id: week.id, student_id: studentId, day_date: dayDate },
    },
    update: data,
    create: { week_id: week.id, student_id: studentId, day_date: dayDate, ...data, attendance: attendance ?? false },
  });

  await maybeAwardWeeklyCoins(week.id, studentId);
  syncJournalSafe(groupId);

  res.json({ success: true, entry });
};

// ===== Schedule tab — TimetableEntry-и ин гурӯҳ (nested view) =====

const WEEKDAYS = ["Mn", "Tu", "Wd", "Th", "Fr", "Sa", "Su"];
const slotDto = (s: any) => ({ id: s.id, weekday: s.weekday, start: s.start, end: s.end });

export const getGroupSchedule = async (req: Request, res: Response) => {
  const slots = await prisma.groupScheduleSlot.findMany({ where: { group_id: Number(req.params.id) } });
  const sorted = slots.sort((a, b) => WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday));
  res.json({ data: sorted.map(slotDto) });
};

export const createGroupScheduleEntry = async (req: Request, res: Response) => {
  const { weekday, start, end } = req.body ?? {};
  if (!weekday || !start || !end)
    return res.status(400).json({ message: "weekday, start ва end ҳатмист" });

  const slot = await prisma.groupScheduleSlot.create({
    data: { group_id: Number(req.params.id), weekday, start, end },
  });
  res.status(201).json(slotDto(slot));
};

export const updateGroupScheduleEntry = async (req: Request, res: Response) => {
  const { weekday, start, end } = req.body ?? {};
  const slot = await prisma.groupScheduleSlot.update({
    where: { id: Number(req.params.entryId) },
    data: { weekday, start, end },
  });
  res.json(slotDto(slot));
};

export const deleteGroupScheduleEntry = async (req: Request, res: Response) => {
  await prisma.groupScheduleSlot.delete({ where: { id: Number(req.params.entryId) } });
  res.json({ success: true });
};
