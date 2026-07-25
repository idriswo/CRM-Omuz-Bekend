import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope, buildOrderBy } from "../../utils/pagination";
import { toId, toInt, toDate } from "../../utils/input";
import { exportToXlsx } from "../../utils/export";

const SORTABLE = ["id", "amount", "paid", "discount", "date", "status"] as const;

const paymentsWhere = (query: any) => {
  const { student_id, group_id, branch_id, status } = query;
  const where: any = {};
  if (student_id) where.student_id = Number(student_id);
  if (group_id) where.group_id = Number(group_id);
  if (branch_id) where.branch_id = Number(branch_id);
  if (status) where.status = status;
  return where;
};

export const getPayments = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const where = paymentsWhere(req.query);

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy(sort_by, sort_dir, SORTABLE),
      include: { student: true },
    }),
    prisma.payment.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const getPrepayments = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const where = { ...paymentsWhere(req.query), status: "prepayment" };

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy(sort_by, sort_dir, SORTABLE),
      include: { student: true },
    }),
    prisma.payment.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

const PAYMENT_STATUSES = ["active", "prepayment"];

export const createPayment = async (req: Request, res: Response) => {
  const { student_id, amount, discount, paid, date, group_id, branch_id, status } = req.body ?? {};

  const studentId = toId(student_id);
  const amountValue = toInt(amount);
  const paidValue = toInt(paid);
  const dateValue = toDate(date);

  if (!studentId) return res.status(400).json({ message: "student_id ҳатмист" });
  if (amountValue === undefined) return res.status(400).json({ message: "amount ҳатмист" });
  if (paidValue === undefined) return res.status(400).json({ message: "paid ҳатмист" });
  if (!dateValue) return res.status(400).json({ message: "date ҳатмист ва бояд санаи дуруст бошад" });
  if (!PAYMENT_STATUSES.includes(status)) {
    return res.status(400).json({ message: `status бояд яке аз инҳо бошад: ${PAYMENT_STATUSES.join(", ")}` });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return res.status(404).json({ message: "Донишҷӯ ёфт нашуд" });

  const payment = await prisma.payment.create({
    data: {
      student_id: studentId,
      amount: amountValue,
      discount: toInt(discount),
      paid: paidValue,
      date: dateValue,
      group_id: toId(group_id),
      branch_id: toId(branch_id),
      status,
    },
  });
  res.status(201).json(payment);
};

export const updatePayment = async (req: Request, res: Response) => {
  const { student_id, amount, discount, paid, date, group_id, branch_id, status } = req.body ?? {};

  if (date !== undefined && !toDate(date)) {
    return res.status(400).json({ message: "date санаи дуруст нест" });
  }
  if (status !== undefined && !PAYMENT_STATUSES.includes(status)) {
    return res.status(400).json({ message: `status бояд яке аз инҳо бошад: ${PAYMENT_STATUSES.join(", ")}` });
  }

  const payment = await prisma.payment.update({
    where: { id: Number(req.params.id) },
    data: {
      student_id: toId(student_id),
      amount: toInt(amount),
      discount: toInt(discount),
      // toInt, на `paid ? ... : undefined` — вагарна paid=0 партофта мешуд
      // ва пардохтро ба сифр баргардонидан имконнопазир буд
      paid: toInt(paid),
      date: toDate(date),
      group_id: toId(group_id),
      branch_id: toId(branch_id),
      status,
    },
  });
  res.json(payment);
};

export const deletePayment = async (req: Request, res: Response) => {
  await prisma.payment.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};

export const exportPayments = async (req: Request, res: Response) => {
  const where = paymentsWhere(req.query);
  const rows = await prisma.payment.findMany({ where, include: { student: true } });
  await exportToXlsx(
    res,
    rows.map((p) => ({
      full_name: `${p.student.first_name} ${p.student.last_name}`,
      amount: p.amount,
      discount: p.discount,
      paid: p.paid,
      status: p.status,
    })),
    [
      { header: "Full name", key: "full_name" },
      { header: "Amount", key: "amount" },
      { header: "Discount", key: "discount" },
      { header: "Paid", key: "paid" },
      { header: "Status", key: "status" },
    ],
    "payments"
  );
};
