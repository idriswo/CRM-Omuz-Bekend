import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { toId, toInt, toDate } from "../../utils/input";
import { getPagination, buildEnvelope, buildOrderBy } from "../../utils/pagination";

const SORTABLE = ["id", "category_name", "from_date", "to_date", "amount_allocated", "amount_spent", "status"] as const;

export const getBudgets = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const { status } = req.query;
  const where: any = {};
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.budget.findMany({ where, skip, take: limit, orderBy: buildOrderBy(sort_by, sort_dir, SORTABLE) }),
    prisma.budget.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const createBudget = async (req: Request, res: Response) => {
  const { category_name, from_date, to_date, amount_allocated, amount_spent, status } = req.body ?? {};
  const fromDate = toDate(from_date);
  const toDateValue = toDate(to_date);
  const allocated = toInt(amount_allocated);

  if (!category_name || !fromDate || !toDateValue || allocated === undefined || !status) {
    return res.status(400).json({
      message: "category_name, status, amount_allocated ва санаҳои дурусти from_date/to_date ҳатмист",
    });
  }
  if (fromDate > toDateValue) {
    return res.status(400).json({ message: "from_date наметавонад аз to_date дертар бошад" });
  }

  const budget = await prisma.budget.create({
    data: {
      category_name,
      from_date: fromDate,
      to_date: toDateValue,
      amount_allocated: allocated,
      amount_spent: toInt(amount_spent),
      status,
    },
  });
  res.status(201).json(budget);
};

export const updateBudget = async (req: Request, res: Response) => {
  const { category_name, from_date, to_date, amount_allocated, amount_spent, status } = req.body ?? {};
  if ((from_date !== undefined && !toDate(from_date)) || (to_date !== undefined && !toDate(to_date))) {
    return res.status(400).json({ message: "from_date ё to_date санаи дуруст нест" });
  }

  const budget = await prisma.budget.update({
    where: { id: Number(req.params.id) },
    data: {
      category_name,
      from_date: toDate(from_date),
      to_date: toDate(to_date),
      amount_allocated: toInt(amount_allocated),
      amount_spent: toInt(amount_spent),
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
