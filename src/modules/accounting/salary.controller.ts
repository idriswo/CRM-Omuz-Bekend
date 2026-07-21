import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";

export const getSalaries = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const { employee_id, branch_id } = req.query;
  const where: any = {};
  if (employee_id) where.employee_id = Number(employee_id);
  if (branch_id) where.branch_id = Number(branch_id);

  const [data, total] = await Promise.all([
    prisma.salary.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort_by as string]: sort_dir },
      include: { employee: true },
    }),
    prisma.salary.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const createSalary = async (req: Request, res: Response) => {
  const { employee_id, amount, date, branch_id } = req.body;
  const salary = await prisma.salary.create({
    data: { employee_id: Number(employee_id), amount: Number(amount), date: new Date(date), branch_id: Number(branch_id) },
  });
  res.status(201).json(salary);
};

export const updateSalary = async (req: Request, res: Response) => {
  const { employee_id, amount, date, branch_id } = req.body;
  const salary = await prisma.salary.update({
    where: { id: Number(req.params.id) },
    data: {
      employee_id: employee_id ? Number(employee_id) : undefined,
      amount: amount ? Number(amount) : undefined,
      date: date ? new Date(date) : undefined,
      branch_id: branch_id ? Number(branch_id) : undefined,
    },
  });
  res.json(salary);
};

export const deleteSalary = async (req: Request, res: Response) => {
  await prisma.salary.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};
