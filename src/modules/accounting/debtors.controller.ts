import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";
import { exportToXlsx } from "../../utils/export";

const computeStatus = (total_debt_amount: number, total_paid_amount: number) =>
  total_paid_amount >= total_debt_amount ? "paid" : "inprogress";

const debtorsWhere = (query: any) => {
  const { student_id, status } = query;
  const where: any = {};
  if (student_id) where.student_id = Number(student_id);
  if (status) where.status = status;
  return where;
};

export const getDebtors = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const where = debtorsWhere(req.query);

  const [data, total] = await Promise.all([
    prisma.debtor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort_by as string]: sort_dir },
      include: { student: true },
    }),
    prisma.debtor.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const createDebtor = async (req: Request, res: Response) => {
  const { student_id, from_date, to_date, total_debt_amount, payment_per_month, total_paid_amount, notes } = req.body;
  const paidAmount = total_paid_amount ? Number(total_paid_amount) : 0;
  const debtAmount = Number(total_debt_amount);

  const debtor = await prisma.debtor.create({
    data: {
      student_id: Number(student_id),
      from_date: new Date(from_date),
      to_date: new Date(to_date),
      total_debt_amount: debtAmount,
      payment_per_month: Number(payment_per_month),
      total_paid_amount: paidAmount,
      notes,
      status: computeStatus(debtAmount, paidAmount),
    },
  });
  res.status(201).json(debtor);
};

export const updateDebtor = async (req: Request, res: Response) => {
  const { from_date, to_date, total_debt_amount, payment_per_month, total_paid_amount, notes } = req.body;

  const existing = await prisma.debtor.findUnique({ where: { id: Number(req.params.id) } });
  if (!existing) return res.status(404).json({ message: "Қарздор ёфт нашуд" });

  const debtAmount = total_debt_amount !== undefined ? Number(total_debt_amount) : existing.total_debt_amount;
  const paidAmount = total_paid_amount !== undefined ? Number(total_paid_amount) : existing.total_paid_amount;

  const debtor = await prisma.debtor.update({
    where: { id: existing.id },
    data: {
      from_date: from_date ? new Date(from_date) : undefined,
      to_date: to_date ? new Date(to_date) : undefined,
      total_debt_amount: debtAmount,
      payment_per_month: payment_per_month !== undefined ? Number(payment_per_month) : undefined,
      total_paid_amount: paidAmount,
      notes,
      status: computeStatus(debtAmount, paidAmount),
    },
  });
  res.json(debtor);
};

export const deleteDebtor = async (req: Request, res: Response) => {
  await prisma.debtor.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};

export const exportDebtors = async (req: Request, res: Response) => {
  const where = debtorsWhere(req.query);
  const rows = await prisma.debtor.findMany({ where, include: { student: true } });
  await exportToXlsx(
    res,
    rows.map((d) => ({
      full_name: `${d.student.first_name} ${d.student.last_name}`,
      total_debt_amount: d.total_debt_amount,
      total_paid_amount: d.total_paid_amount,
      status: d.status,
    })),
    [
      { header: "Full name", key: "full_name" },
      { header: "Total debt", key: "total_debt_amount" },
      { header: "Total paid", key: "total_paid_amount" },
      { header: "Status", key: "status" },
    ],
    "debtors"
  );
};
