import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { toId, toInt, toDate } from "../../utils/input";
import { getPagination, buildEnvelope, buildOrderBy } from "../../utils/pagination";
import { exportToXlsx } from "../../utils/export";

const SORTABLE = ["id", "from_date", "to_date", "total_debt_amount", "total_paid_amount", "status"] as const;

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
      orderBy: buildOrderBy(sort_by, sort_dir, SORTABLE),
      include: { student: true },
    }),
    prisma.debtor.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const createDebtor = async (req: Request, res: Response) => {
  const { student_id, from_date, to_date, total_debt_amount, payment_per_month, total_paid_amount, notes } =
    req.body ?? {};

  const studentId = toId(student_id);
  const fromDate = toDate(from_date);
  const toDateValue = toDate(to_date);
  const debtAmount = toInt(total_debt_amount);
  const perMonth = toInt(payment_per_month);
  const paidAmount = toInt(total_paid_amount) ?? 0;

  if (!studentId || !fromDate || !toDateValue || debtAmount === undefined || perMonth === undefined) {
    return res.status(400).json({
      message:
        "student_id, total_debt_amount, payment_per_month ва санаҳои дурусти from_date/to_date ҳатмист",
    });
  }
  if (fromDate > toDateValue) {
    return res.status(400).json({ message: "from_date наметавонад аз to_date дертар бошад" });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return res.status(404).json({ message: "Донишҷӯ ёфт нашуд" });

  const debtor = await prisma.debtor.create({
    data: {
      student_id: studentId,
      from_date: fromDate,
      to_date: toDateValue,
      total_debt_amount: debtAmount,
      payment_per_month: perMonth,
      total_paid_amount: paidAmount,
      notes,
      status: computeStatus(debtAmount, paidAmount),
    },
  });
  res.status(201).json(debtor);
};

export const updateDebtor = async (req: Request, res: Response) => {
  const { from_date, to_date, total_debt_amount, payment_per_month, total_paid_amount, notes } = req.body;

  if ((from_date !== undefined && !toDate(from_date)) || (to_date !== undefined && !toDate(to_date))) {
    return res.status(400).json({ message: "from_date ё to_date санаи дуруст нест" });
  }

  const existing = await prisma.debtor.findUnique({ where: { id: Number(req.params.id) } });
  if (!existing) return res.status(404).json({ message: "Қарздор ёфт нашуд" });

  const debtAmount = toInt(total_debt_amount) ?? existing.total_debt_amount;
  const paidAmount = toInt(total_paid_amount) ?? existing.total_paid_amount;

  const debtor = await prisma.debtor.update({
    where: { id: existing.id },
    data: {
      from_date: toDate(from_date),
      to_date: toDate(to_date),
      total_debt_amount: debtAmount,
      payment_per_month: toInt(payment_per_month),
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
