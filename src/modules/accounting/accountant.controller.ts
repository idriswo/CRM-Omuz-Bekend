import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

// Хулосаи маош/аванс аз рӯи ҳар корманд (ментор)
export const getAccountantSummary = async (_req: Request, res: Response) => {
  const employees = await prisma.employee.findMany({
    include: { salaries: true, avans: true },
  });

  const data = employees.map((e) => ({
    employee_id: e.id,
    full_name: `${e.first_name} ${e.last_name}`,
    position: e.position,
    total_salary: e.salaries.reduce((sum, s) => sum + s.amount, 0),
    total_avans: e.avans.reduce((sum, a) => sum + a.amount, 0),
  }));

  res.json(data.filter((d) => d.total_salary > 0 || d.total_avans > 0));
};

export const getAccountantChart = async (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const [salaries, avans] = await Promise.all([
    prisma.salary.findMany({ where: { date: { gte: start, lt: end } }, select: { date: true, amount: true } }),
    prisma.avans.findMany({ where: { date: { gte: start, lt: end } }, select: { date: true, amount: true } }),
  ]);

  const result: Record<number, { salary: number; avans: number }> = {};
  for (const s of salaries) {
    const month = s.date.getMonth() + 1;
    if (!result[month]) result[month] = { salary: 0, avans: 0 };
    result[month].salary += s.amount;
  }
  for (const a of avans) {
    const month = a.date.getMonth() + 1;
    if (!result[month]) result[month] = { salary: 0, avans: 0 };
    result[month].avans += a.amount;
  }

  res.json(result);
};
