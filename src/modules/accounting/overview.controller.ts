import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { ROLES } from "../../constants/roles";

/**
 * Ойлик танҳо ба director дахл дорад. overview/net/chart ҷамъи ойлик ва
 * авансро дар бар мегиранд, бинобар ин барои superadmin он майдонҳо аз
 * ҷавоб бароварда мешаванд — вагарна манъи `/accounting/salary` маънӣ надошт,
 * чун ҳамон рақамро аз ин ҷо гирифтан мумкин буд.
 *
 * `net` низ бароварда мешавад: он аз ойлик ҳисоб мешавад ва аз рӯи он
 * ҷамъи ойликро баровардан мумкин аст.
 */
const seesSalary = (req: AuthRequest) => req.user?.role === ROLES.DIRECTOR;

export const getOverview = async (req: AuthRequest, res: Response) => {
  const [income, expenses, salaries, avans, budgets, debtors] = await Promise.all([
    prisma.payment.aggregate({ _sum: { paid: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.salary.aggregate({ _sum: { amount: true } }),
    prisma.avans.aggregate({ _sum: { amount: true } }),
    prisma.budget.aggregate({ _sum: { amount_allocated: true, amount_spent: true } }),
    prisma.debtor.aggregate({ _sum: { total_debt_amount: true, total_paid_amount: true } }),
  ]);

  const total_income = income._sum.paid ?? 0;
  const total_expenses = expenses._sum.amount ?? 0;
  const total_salaries = salaries._sum.amount ?? 0;
  const total_avans = avans._sum.amount ?? 0;

  res.json({
    total_income,
    total_expenses,
    budget_allocated: budgets._sum.amount_allocated ?? 0,
    budget_spent: budgets._sum.amount_spent ?? 0,
    total_debt: debtors._sum.total_debt_amount ?? 0,
    total_debt_paid: debtors._sum.total_paid_amount ?? 0,
    ...(seesSalary(req)
      ? {
          total_salaries,
          total_avans,
          net: total_income - total_expenses - total_salaries - total_avans,
        }
      : {}),
  });
};

export const getOverviewChart = async (req: AuthRequest, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const [payments, expenses, salaries, avans] = await Promise.all([
    prisma.payment.findMany({ where: { date: { gte: start, lt: end } }, select: { date: true, paid: true } }),
    prisma.expense.findMany({ where: { date: { gte: start, lt: end } }, select: { date: true, amount: true } }),
    prisma.salary.findMany({ where: { date: { gte: start, lt: end } }, select: { date: true, amount: true } }),
    prisma.avans.findMany({ where: { date: { gte: start, lt: end } }, select: { date: true, amount: true } }),
  ]);

  const result: Record<number, { income: number; expenses: number; salaries: number; avans: number }> = {};
  const bump = (arr: { date: Date; amount?: number; paid?: number }[], key: "income" | "expenses" | "salaries" | "avans", field: "amount" | "paid") => {
    for (const row of arr) {
      const month = row.date.getMonth() + 1;
      if (!result[month]) result[month] = { income: 0, expenses: 0, salaries: 0, avans: 0 };
      result[month][key] += (row as any)[field] ?? 0;
    }
  };
  bump(payments, "income", "paid");
  bump(expenses, "expenses", "amount");
  if (seesSalary(req)) {
    bump(salaries, "salaries", "amount");
    bump(avans, "avans", "amount");
  }

  // Барои superadmin сутунҳои ойлик/аванс тамоман бароварда мешаванд,
  // на танҳо сифр — вагарна набудани маълумот аз сифр фарқ намекард
  if (!seesSalary(req)) {
    for (const month of Object.keys(result)) {
      const { salaries: _s, avans: _a, ...rest } = result[Number(month)];
      result[Number(month)] = rest as any;
    }
  }

  res.json(result);
};

export const getStudentsPaymentOverview = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where: { payments: { some: {} } },
      skip,
      take: limit,
      orderBy: { id: "desc" },
      include: { payments: true },
    }),
    prisma.student.count({ where: { payments: { some: {} } } }),
  ]);

  const data = students.map((s) => {
    const totalAmount = s.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = s.payments.reduce((sum, p) => sum + p.paid, 0);
    return {
      student_id: s.id,
      full_name: `${s.first_name} ${s.last_name}`,
      total_amount: totalAmount,
      total_paid: totalPaid,
      remaining: totalAmount - totalPaid,
    };
  });

  res.json(buildEnvelope(data, total, page, limit));
};
