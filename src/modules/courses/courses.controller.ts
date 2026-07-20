import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";

export const getCourses = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const { search } = req.query;

  const where: any = {};
  if (search) where.name = { contains: String(search), mode: "insensitive" };

  const [data, total] = await Promise.all([
    prisma.course.findMany({ where, skip, take: limit, orderBy: { [sort_by as string]: sort_dir } }),
    prisma.course.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const getCourseById = async (req: Request, res: Response) => {
  const course = await prisma.course.findUnique({ where: { id: Number(req.params.id) } });
  if (!course) return res.status(404).json({ message: "Курс ёфт нашуд" });
  res.json(course);
};

export const createCourse = async (req: Request, res: Response) => {
  const { name, description, duration, price } = req.body;
  const course = await prisma.course.create({ data: { name, description, duration, price } });
  res.status(201).json(course);
};

export const updateCourse = async (req: Request, res: Response) => {
  const { name, description, duration, price } = req.body;
  const course = await prisma.course.update({
    where: { id: Number(req.params.id) },
    data: { name, description, duration, price },
  });
  res.json(course);
};

export const deleteCourse = async (req: Request, res: Response) => {
  await prisma.course.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};
