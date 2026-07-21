import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";
import { exportToXlsx } from "../../utils/export";

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
      orderBy: { [sort_by as string]: sort_dir },
      include: { student: true },
    }),
    prisma.payment.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const createPayment = async (req: Request, res: Response) => {
  const { student_id, amount, discount, paid, date, group_id, branch_id, status } = req.body;
  const payment = await prisma.payment.create({
    data: {
      student_id: Number(student_id),
      amount: Number(amount),
      discount: discount ? Number(discount) : undefined,
      paid: Number(paid),
      date: new Date(date),
      group_id: group_id ? Number(group_id) : undefined,
      branch_id: branch_id ? Number(branch_id) : undefined,
      status,
    },
  });
  res.status(201).json(payment);
};

export const updatePayment = async (req: Request, res: Response) => {
  const { student_id, amount, discount, paid, date, group_id, branch_id, status } = req.body;
  const payment = await prisma.payment.update({
    where: { id: Number(req.params.id) },
    data: {
      student_id: student_id ? Number(student_id) : undefined,
      amount: amount ? Number(amount) : undefined,
      discount: discount !== undefined ? Number(discount) : undefined,
      paid: paid ? Number(paid) : undefined,
      date: date ? new Date(date) : undefined,
      group_id: group_id ? Number(group_id) : undefined,
      branch_id: branch_id ? Number(branch_id) : undefined,
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
