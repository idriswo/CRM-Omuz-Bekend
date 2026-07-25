import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { toId, toInt, toDate } from "../../utils/input";
import { getPagination, buildEnvelope, buildOrderBy } from "../../utils/pagination";

const SORTABLE = ["id", "title", "amount", "date"] as const;

export const getExpenses = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);

  const [data, total] = await Promise.all([
    prisma.expense.findMany({ skip, take: limit, orderBy: buildOrderBy(sort_by, sort_dir, SORTABLE) }),
    prisma.expense.count(),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const createExpense = async (req: Request, res: Response) => {
  const { title, amount, date } = req.body ?? {};
  const amountValue = toInt(amount);
  const dateValue = toDate(date);

  if (!title || amountValue === undefined || !dateValue) {
    return res.status(400).json({ message: "title, amount ва санаи дурусти date ҳатмист" });
  }

  const expense = await prisma.expense.create({
    data: { title, amount: amountValue, date: dateValue },
  });
  res.status(201).json(expense);
};

export const updateExpense = async (req: Request, res: Response) => {
  const { title, amount, date } = req.body ?? {};
  if (date !== undefined && !toDate(date)) {
    return res.status(400).json({ message: "date санаи дуруст нест" });
  }
  const expense = await prisma.expense.update({
    where: { id: Number(req.params.id) },
    data: { title, amount: toInt(amount), date: toDate(date) },
  });
  res.json(expense);
};

export const deleteExpense = async (req: Request, res: Response) => {
  await prisma.expense.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};
