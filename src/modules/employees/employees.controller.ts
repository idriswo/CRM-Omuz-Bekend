import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";

export const getEmployees = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const { search, branch_id, position } = req.query;

  const where: any = {};
  if (search)
    where.OR = [
      { first_name: { contains: String(search), mode: "insensitive" } },
      { last_name: { contains: String(search), mode: "insensitive" } },
    ];
  if (branch_id) where.branch_id = Number(branch_id);
  if (position) where.position = position;

  const [data, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort_by as string]: sort_dir },
      include: { mentor_level: true },
    }),
    prisma.employee.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const getEmployeeById = async (req: Request, res: Response) => {
  const employee = await prisma.employee.findUnique({
    where: { id: Number(req.params.id) },
    include: { mentor_level: true },
  });
  if (!employee) return res.status(404).json({ message: "Корманд ёфт нашуд" });
  res.json(employee);
};

export const createEmployee = async (req: Request, res: Response) => {
  const { first_name, last_name, position, experience, branch_id, phone, email } = req.body;
  const employee = await prisma.employee.create({
    data: {
      first_name,
      last_name,
      position,
      experience,
      branch_id: branch_id ? Number(branch_id) : undefined,
      phone,
      email,
    },
  });
  res.status(201).json(employee);
};

export const updateEmployee = async (req: Request, res: Response) => {
  const { first_name, last_name, position, experience, branch_id, phone, email } = req.body;
  const employee = await prisma.employee.update({
    where: { id: Number(req.params.id) },
    data: {
      first_name,
      last_name,
      position,
      experience,
      branch_id: branch_id ? Number(branch_id) : undefined,
      phone,
      email,
    },
  });
  res.json(employee);
};

export const deleteEmployee = async (req: Request, res: Response) => {
  await prisma.employee.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};

export const getMentorLevels = async (_req: Request, res: Response) => {
  const levels = await prisma.mentorLevel.findMany({ include: { employee: true } });
  res.json(levels);
};

export const updateMentorLevel = async (req: Request, res: Response) => {
  const { level } = req.body;
  const mentorLevel = await prisma.mentorLevel.update({
    where: { id: Number(req.params.id) },
    data: { level },
  });
  res.json(mentorLevel);
};
