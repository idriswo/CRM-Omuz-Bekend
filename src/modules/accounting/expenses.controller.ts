import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";

export const getExpenses = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);

  const [data, total] = await Promise.all([
    prisma.expense.findMany({ skip, take: limit, orderBy: { [sort_by as string]: sort_dir } }),
    prisma.expense.count(),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const createExpense = async (req: Request, res: Response) => {
  const { title, amount, date } = req.body;
  const expense = await prisma.expense.create({
    data: { title, amount: Number(amount), date: new Date(date) },
  });
  res.status(201).json(expense);
};

export const updateExpense = async (req: Request, res: Response) => {
  const { title, amount, date } = req.body;
  const expense = await prisma.expense.update({
    where: { id: Number(req.params.id) },
    data: { title, amount: amount ? Number(amount) : undefined, date: date ? new Date(date) : undefined },
  });
  res.json(expense);
};

export const deleteExpense = async (req: Request, res: Response) => {
  await prisma.expense.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};
