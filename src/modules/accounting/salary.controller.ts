import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { toId, toInt, toDate } from "../../utils/input";
import { getPagination, buildEnvelope, buildOrderBy } from "../../utils/pagination";

const SORTABLE = ["id", "amount", "date"] as const;

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
      orderBy: buildOrderBy(sort_by, sort_dir, SORTABLE),
      include: { employee: true },
    }),
    prisma.salary.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const createSalary = async (req: Request, res: Response) => {
  const { employee_id, amount, date, branch_id } = req.body ?? {};
  const employeeId = toId(employee_id);
  const branchId = toId(branch_id);
  const amountValue = toInt(amount);
  const dateValue = toDate(date);

  if (!employeeId || !branchId || amountValue === undefined || !dateValue) {
    return res
      .status(400)
      .json({ message: "employee_id, branch_id, amount ва санаи дурусти date ҳатмист" });
  }

  const salary = await prisma.salary.create({
    data: { employee_id: employeeId, amount: amountValue, date: dateValue, branch_id: branchId },
  });
  res.status(201).json(salary);
};

export const updateSalary = async (req: Request, res: Response) => {
  const { employee_id, amount, date, branch_id } = req.body ?? {};
  if (date !== undefined && !toDate(date)) {
    return res.status(400).json({ message: "date санаи дуруст нест" });
  }
  const salary = await prisma.salary.update({
    where: { id: Number(req.params.id) },
    data: {
      employee_id: toId(employee_id),
      amount: toInt(amount),
      date: toDate(date),
      branch_id: toId(branch_id),
    },
  });
  res.json(salary);
};

export const deleteSalary = async (req: Request, res: Response) => {
  await prisma.salary.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};
