import { Request, Response } from "express";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "../../utils/prisma";

// Эзоҳ: TZ дар боби Dashboard мисоли "Attendance" (бо status present/absent/late)-ро меорад,
// вале дар Phase 6 мо attendance-ро ҳамчун майдони Boolean дар JournalEntry сохтем (тибқи
// боби 4-и TZ). Бинобар ин дар ин ҷо present/absent аз рӯи JournalEntry.attendance ҳисоб
// карда мешавад; "late" дар модел вуҷуд надорад, бинобар ин 0 бармегардад.

export const getDashboardStats = async (_req: Request, res: Response) => {
  const [students_count, users_count, employees_count] = await Promise.all([
    prisma.student.count(),
    prisma.user.count(),
    prisma.employee.count(),
  ]);

  const dayStart = startOfDay(new Date());
  const dayEnd = endOfDay(new Date());
  const [present, absent] = await Promise.all([
    prisma.journalEntry.count({ where: { day_date: { gte: dayStart, lte: dayEnd }, attendance: true } }),
    prisma.journalEntry.count({ where: { day_date: { gte: dayStart, lte: dayEnd }, attendance: false } }),
  ]);

  res.json({ students_count, users_count, employees_count, present, absent, late: 0 });
};

export const getAttendanceLog = async (req: Request, res: Response) => {
  const date = req.query.date ? new Date(String(req.query.date)) : new Date();
  const entries = await prisma.journalEntry.findMany({
    where: { day_date: { gte: startOfDay(date), lte: endOfDay(date) } },
    include: { student: true },
  });
  res.json(entries);
};

export const getGroupsSummary = async (_req: Request, res: Response) => {
  const groups = await prisma.group.findMany({
    include: { weeks: { include: { entries: true } }, _count: { select: { students: true } } },
  });
  const incomeByGroup = await prisma.payment.groupBy({ by: ["group_id"], _sum: { paid: true } });
  const incomeMap = new Map(incomeByGroup.map((i) => [i.group_id, i._sum.paid ?? 0]));

  const summary = groups.map((g) => {
    const entries = g.weeks.flatMap((w) => w.entries);
    return {
      group_id: g.id,
      group_name: g.name,
      students_count: g._count.students,
      present: entries.filter((e) => e.attendance).length,
      absent: entries.filter((e) => !e.attendance).length,
      income: incomeMap.get(g.id) ?? 0,
    };
  });
  res.json(summary);
};

export const getLeadsChart = async (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const leads = await prisma.lead.findMany({
    where: { created_at: { gte: start, lt: end } },
    select: { created_at: true },
  });

  const result: Record<number, number> = {};
  for (const lead of leads) {
    const month = lead.created_at.getMonth() + 1;
    result[month] = (result[month] || 0) + 1;
  }
  res.json(result);
};

export const getAttendanceChart = async (req: Request, res: Response) => {
  const base = req.query.month ? new Date(String(req.query.month)) : new Date();
  const start = startOfMonth(base);
  const end = endOfMonth(base);

  const entries = await prisma.journalEntry.findMany({
    where: { day_date: { gte: start, lte: end } },
    select: { day_date: true, attendance: true },
  });

  const result: Record<string, { present: number; absent: number }> = {};
  for (const e of entries) {
    const day = e.day_date.toISOString().slice(0, 10);
    if (!result[day]) result[day] = { present: 0, absent: 0 };
    if (e.attendance) result[day].present++;
    else result[day].absent++;
  }
  res.json(result);
};

export const getIncome = async (req: Request, res: Response) => {
  const base = req.query.month ? new Date(String(req.query.month)) : new Date();
  const start = startOfMonth(base);
  const end = endOfMonth(base);

  const payments = await prisma.payment.findMany({
    where: { date: { gte: start, lte: end } },
    select: { date: true, paid: true },
  });

  const byDay: Record<string, number> = {};
  let total = 0;
  for (const p of payments) {
    const day = p.date.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + p.paid;
    total += p.paid;
  }
  res.json({ total, by_day: byDay });
};

export const getEnrollChart = async (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const students = await prisma.student.findMany({
    where: { created_at: { gte: start, lt: end } },
    select: { created_at: true },
  });

  const result: Record<number, number> = {};
  for (const s of students) {
    const month = s.created_at.getMonth() + 1;
    result[month] = (result[month] || 0) + 1;
  }
  res.json(result);
};

export const getEmployedGraduates = async (_req: Request, res: Response) => {
  const [total_graduates, employed] = await Promise.all([
    prisma.student.count({ where: { status: "finished" } }),
    prisma.graduateInfo.count({ where: { work_place: { not: null } } }),
  ]);
  res.json({ total_graduates, employed, unemployed: total_graduates - employed });
};

export const getLeftCourses = async (_req: Request, res: Response) => {
  // "Left" = донишҷӯёне, ки статусашон inactive аст (на finished, на active)
  const groups = await prisma.group.findMany({
    include: {
      course: true,
      students: { where: { status: "inactive" } },
    },
  });
  const result = groups
    .filter((g) => g.students.length > 0)
    .map((g) => ({ course_id: g.course_id, course_name: g.course.name, group_id: g.id, left_count: g.students.length }));
  res.json(result);
};
