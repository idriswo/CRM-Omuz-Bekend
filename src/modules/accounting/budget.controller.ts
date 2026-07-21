import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";

export const getBudgets = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const { status } = req.query;
  const where: any = {};
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.budget.findMany({ where, skip, take: limit, orderBy: { [sort_by as string]: sort_dir } }),
    prisma.budget.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const createBudget = async (req: Request, res: Response) => {
  const { category_name, from_date, to_date, amount_allocated, amount_spent, status } = req.body;
  const budget = await prisma.budget.create({
    data: {
      category_name,
      from_date: new Date(from_date),
      to_date: new Date(to_date),
      amount_allocated: Number(amount_allocated),
      amount_spent: amount_spent ? Number(amount_spent) : undefined,
      status,
    },
  });
  res.status(201).json(budget);
};

export const updateBudget = async (req: Request, res: Response) => {
  const { category_name, from_date, to_date, amount_allocated, amount_spent, status } = req.body;
  const budget = await prisma.budget.update({
    where: { id: Number(req.params.id) },
    data: {
      category_name,
      from_date: from_date ? new Date(from_date) : undefined,
      to_date: to_date ? new Date(to_date) : undefined,
      amount_allocated: amount_allocated ? Number(amount_allocated) : undefined,
      amount_spent: amount_spent !== undefined ? Number(amount_spent) : undefined,
      status,
    },
  });
  res.json(budget);
};

export const deleteBudget = async (req: Request, res: Response) => {
  await prisma.budget.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};

export const getBudgetChart = async (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const budgets = await prisma.budget.findMany({
    where: { from_date: { gte: start, lt: end } },
  });

  const result: Record<number, { amount_allocated: number; amount_spent: number }> = {};
  for (const b of budgets) {
    const month = b.from_date.getMonth() + 1;
    if (!result[month]) result[month] = { amount_allocated: 0, amount_spent: 0 };
    result[month].amount_allocated += b.amount_allocated;
    result[month].amount_spent += b.amount_spent;
  }
  res.json(result);
};
