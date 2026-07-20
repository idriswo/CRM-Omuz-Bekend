import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const getBranches = async (_req: Request, res: Response) => {
  const branches = await prisma.branch.findMany({
    orderBy: { id: "desc" },
    include: { _count: { select: { groups: true, students: true } } },
  });
  res.json(branches);
};

export const getBranchById = async (req: Request, res: Response) => {
  const branch = await prisma.branch.findUnique({ where: { id: Number(req.params.id) } });
  if (!branch) return res.status(404).json({ message: "Филиал ёфт нашуд" });
  res.json(branch);
};

export const createBranch = async (req: Request, res: Response) => {
  const { title, city, district, address } = req.body;
  const branch = await prisma.branch.create({ data: { title, city, district, address } });
  res.status(201).json(branch);
};

export const updateBranch = async (req: Request, res: Response) => {
  const { title, city, district, address } = req.body;
  const branch = await prisma.branch.update({
    where: { id: Number(req.params.id) },
    data: { title, city, district, address },
  });
  res.json(branch);
};

export const deleteBranch = async (req: Request, res: Response) => {
  await prisma.branch.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};

export const getBranchesChart = async (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const students = await prisma.student.findMany({
    where: { created_at: { gte: start, lt: end } },
    select: { branch_id: true, created_at: true },
  });

  const result: Record<string, Record<number, number>> = {};
  for (const s of students) {
    const month = s.created_at.getMonth() + 1;
    const key = String(s.branch_id ?? "unknown");
    result[key] = result[key] || {};
    result[key][month] = (result[key][month] || 0) + 1;
  }
  res.json(result);
};
