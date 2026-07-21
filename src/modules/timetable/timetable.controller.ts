import { Request, Response } from "express";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, addDays } from "date-fns";
import { prisma } from "../../utils/prisma";

function getRange(view: string, dateStr?: string) {
  const base = dateStr ? new Date(dateStr) : new Date();
  switch (view) {
    case "week":
      return { start: startOfWeek(base), end: endOfWeek(base) };
    case "month":
      return { start: startOfMonth(base), end: endOfMonth(base) };
    default:
      return { start: startOfDay(base), end: endOfDay(base) };
  }
}

export const getTimetable = async (req: Request, res: Response) => {
  const { view = "week", date, group_id, mentor_id } = req.query;
  const { start, end } = getRange(String(view), date as string | undefined);

  const where: any = {};
  if (group_id) where.group_id = Number(group_id);
  if (mentor_id) where.mentor_id = Number(mentor_id);

  const entries = await prisma.timetableEntry.findMany({ where });

  const result: any[] = [];
  for (const entry of entries) {
    if (entry.repeat_days.length === 0) {
      if (entry.date >= start && entry.date <= end) result.push(entry);
      continue;
    }
    for (let day = new Date(start); day <= end; day = addDays(day, 1)) {
      if (day < entry.date) continue; // такрор фақат аз рӯзи оғоз сар мешавад
      if (entry.repeat_days.includes(day.getDay())) {
        result.push({ ...entry, date: new Date(day) });
      }
    }
  }

  res.json(result);
};

export const getTimetableEntryById = async (req: Request, res: Response) => {
  const entry = await prisma.timetableEntry.findUnique({ where: { id: Number(req.params.id) } });
  if (!entry) return res.status(404).json({ message: "Дарс ёфт нашуд" });
  res.json(entry);
};

export const createTimetableEntry = async (req: Request, res: Response) => {
  const { course_name, group_id, type, start_time, end_time, class_room, mentor_id, date, repeat_days } = req.body;
  const entry = await prisma.timetableEntry.create({
    data: {
      course_name,
      group_id: group_id ? Number(group_id) : undefined,
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

export const updateTimetableEntry = async (req: Request, res: Response) => {
  const { course_name, group_id, type, start_time, end_time, class_room, mentor_id, date, repeat_days } = req.body;
  const entry = await prisma.timetableEntry.update({
    where: { id: Number(req.params.id) },
    data: {
      course_name,
      group_id: group_id ? Number(group_id) : undefined,
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

export const deleteTimetableEntry = async (req: Request, res: Response) => {
  await prisma.timetableEntry.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};
