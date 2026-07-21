import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

// Net = даромад - (хароҷот + маош + аванс)
export const getNet = async (req: Request, res: Response) => {
  const year = req.query.year ? Number(req.query.year) : undefined;
  const month = req.query.month ? String(req.query.month) : undefined;

  let start: Date | undefined;
  let end: Date | undefined;
  if (month) {
    const base = new Date(month);
    start = new Date(base.getFullYear(), base.getMonth(), 1);
    end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  } else if (year) {
    start = new Date(`${year}-01-01T00:00:00.000Z`);
    end = new Date(`${year + 1}-01-01T00:00:00.000Z`);
  }

  const dateFilter = start && end ? { gte: start, lt: end } : undefined;

  const [income, expenses, salaries, avans] = await Promise.all([
    prisma.payment.aggregate({ _sum: { paid: true }, where: dateFilter ? { date: dateFilter } : undefined }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: dateFilter ? { date: dateFilter } : undefined }),
    prisma.salary.aggregate({ _sum: { amount: true }, where: dateFilter ? { date: dateFilter } : undefined }),
    prisma.avans.aggregate({ _sum: { amount: true }, where: dateFilter ? { date: dateFilter } : undefined }),
  ]);

  const total_income = income._sum.paid ?? 0;
  const total_expenses = expenses._sum.amount ?? 0;
  const total_salaries = salaries._sum.amount ?? 0;
  const total_avans = avans._sum.amount ?? 0;

  res.json({
    total_income,
    total_expenses,
    total_salaries,
    total_avans,
    net: total_income - total_expenses - total_salaries - total_avans,
  });
};
