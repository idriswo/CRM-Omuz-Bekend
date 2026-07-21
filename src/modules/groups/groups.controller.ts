import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";

export const getGroups = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const { search, course_id, branch_id, status, tag } = req.query;

  const where: any = {};
  if (search) where.name = { contains: String(search), mode: "insensitive" };
  if (course_id) where.course_id = Number(course_id);
  if (branch_id) where.branch_id = Number(branch_id);
  if (status) where.status = status;
  if (tag) where.tag = tag;

  const [data, total] = await Promise.all([
    prisma.group.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort_by as string]: sort_dir },
      include: { _count: { select: { students: true } } },
    }),
    prisma.group.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const getGroupById = async (req: Request, res: Response) => {
  const group = await prisma.group.findUnique({
    where: { id: Number(req.params.id) },
    include: { students: true, course: true },
  });
  if (!group) return res.status(404).json({ message: "Гурӯҳ ёфт нашуд" });
  res.json(group);
};

export const createGroup = async (req: Request, res: Response) => {
  const { name, course_id, start_date, end_date, duration, required_students, branch_id, status, tag } = req.body;
  const group = await prisma.group.create({
    data: {
      name,
      course_id: Number(course_id),
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      duration,
      required_students: Number(required_students),
      branch_id: Number(branch_id),
      status,
      tag,
    },
  });
  res.status(201).json(group);
};

export const updateGroup = async (req: Request, res: Response) => {
  const { name, course_id, start_date, end_date, duration, required_students, branch_id, status, tag } = req.body;
  const group = await prisma.group.update({
    where: { id: Number(req.params.id) },
    data: {
      name,
      course_id: course_id ? Number(course_id) : undefined,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      duration,
      required_students: required_students ? Number(required_students) : undefined,
      branch_id: branch_id ? Number(branch_id) : undefined,
      status,
      tag,
    },
  });
  res.json(group);
};

export const deleteGroup = async (req: Request, res: Response) => {
  await prisma.group.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};

export const getGroupsStats = async (_req: Request, res: Response) => {
  const stats = await prisma.group.groupBy({
    by: ["tag"],
    _count: { _all: true },
  });
  res.json(stats);
};

export const getGroupJournal = async (req: Request, res: Response) => {
  const groupId = Number(req.params.id);

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      students: true,
      weeks: { include: { entries: true }, orderBy: { week_number: "asc" } },
    },
  });
  if (!group) return res.status(404).json({ message: "Гурӯҳ ёфт нашуд" });

  const weeks = group.weeks.map((week) => ({
    week_id: week.id,
    week_number: week.week_number,
    dates: week.dates,
    students: group.students.map((student) => ({
      student_id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      entries: week.entries.filter((e) => e.student_id === student.id),
    })),
  }));

  res.json({ group_id: group.id, group_name: group.name, weeks });
};

export const addJournalWeek = async (req: Request, res: Response) => {
  const groupId = Number(req.params.id);
  const { week_number, dates } = req.body;

  const week = await prisma.journalWeek.create({
    data: {
      group_id: groupId,
      week_number: Number(week_number),
      dates: (dates as string[]).map((d) => new Date(d)),
    },
  });
  res.status(201).json(week);
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
  const weekId = Number(req.params.weekId);
  const studentId = Number(req.params.studentId);
  const { day_date, attendance, score, bonus, exam } = req.body;
  const dayDate = new Date(day_date);

  const entry = await prisma.journalEntry.upsert({
    where: {
      week_id_student_id_day_date: { week_id: weekId, student_id: studentId, day_date: dayDate },
    },
    update: { attendance, score, bonus, exam },
    create: { week_id: weekId, student_id: studentId, day_date: dayDate, attendance, score, bonus, exam },
  });

  await maybeAwardWeeklyCoins(weekId, studentId);

  res.json(entry);
};

// ===== Schedule tab — TimetableEntry-и ин гурӯҳ (nested view) =====

export const getGroupSchedule = async (req: Request, res: Response) => {
  const groupId = Number(req.params.id);
  const entries = await prisma.timetableEntry.findMany({
    where: { group_id: groupId },
    include: { mentor: true },
    orderBy: { date: "asc" },
  });
  res.json(entries);
};

export const createGroupScheduleEntry = async (req: Request, res: Response) => {
  const groupId = Number(req.params.id);
  const { course_name, type, start_time, end_time, class_room, mentor_id, date, repeat_days } = req.body;
  const entry = await prisma.timetableEntry.create({
    data: {
      course_name,
      group_id: groupId,
      type,
      start_time: new Date(start_time),
      end_time: new Date(end_time),
      class_room,
      mentor_id: Number(mentor_id),
      date: new Date(date),
      repeat_days: repeat_days ?? [],
    },
  });
  res.status(201).json(entry);
};

export const updateGroupScheduleEntry = async (req: Request, res: Response) => {
  const { course_name, type, start_time, end_time, class_room, mentor_id, date, repeat_days } = req.body;
  const entry = await prisma.timetableEntry.update({
    where: { id: Number(req.params.entryId) },
    data: {
      course_name,
      type,
      start_time: start_time ? new Date(start_time) : undefined,
      end_time: end_time ? new Date(end_time) : undefined,
      class_room,
      mentor_id: mentor_id ? Number(mentor_id) : undefined,
      date: date ? new Date(date) : undefined,
      repeat_days,
    },
  });
  res.json(entry);
};

export const deleteGroupScheduleEntry = async (req: Request, res: Response) => {
  await prisma.timetableEntry.delete({ where: { id: Number(req.params.entryId) } });
  res.json({ success: true });
};
