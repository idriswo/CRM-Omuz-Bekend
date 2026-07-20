import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const getBranches = async (_req: Request, res: Response) => {
  // ⚠️ _count (groups/students) илова мешавад пас аз сохтани моделҳои Group/Student (Phase 4/6)
  const branches = await prisma.branch.findMany({ orderBy: { id: "desc" } });
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

export const getBranchesChart = async (_req: Request, res: Response) => {
  // TODO(Phase 4/6): пас аз сохтани модели Student, groupBy(['branch_id','month']) илова кунед
  res.status(501).json({ message: "Ҳанӯз амалӣ нашудааст — ба Student вобаста аст (Phase 4)" });
};
