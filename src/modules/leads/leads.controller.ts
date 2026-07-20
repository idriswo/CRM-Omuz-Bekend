import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";
import { exportToXlsx } from "../../utils/export";

const leadsWhere = (query: any) => {
  const { search, course_id, type, utm_source } = query;
  const where: any = {};
  if (search) where.full_name = { contains: String(search), mode: "insensitive" };
  if (course_id) where.course_id = Number(course_id);
  if (type) where.type = type;
  if (utm_source) where.utm_source = utm_source;
  return where;
};

export const getLeads = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const where = leadsWhere(req.query);

  const [data, total] = await Promise.all([
    prisma.lead.findMany({ where, skip, take: limit, orderBy: { [sort_by as string]: sort_dir } }),
    prisma.lead.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const getLeadById = async (req: Request, res: Response) => {
  const lead = await prisma.lead.findUnique({ where: { id: Number(req.params.id) } });
  if (!lead) return res.status(404).json({ message: "Лид ёфт нашуд" });
  res.json(lead);
};

export const createLead = async (req: Request, res: Response) => {
  const { full_name, phone, lesson_time, course_id, utm_source, occupation, notes } = req.body;
  const lead = await prisma.lead.create({
    data: { full_name, phone, lesson_time, course_id, utm_source, occupation, notes },
  });
  res.status(201).json(lead);
};

export const updateLead = async (req: Request, res: Response) => {
  const { full_name, phone, lesson_time, course_id, utm_source, occupation, notes } = req.body;
  const lead = await prisma.lead.update({
    where: { id: Number(req.params.id) },
    data: { full_name, phone, lesson_time, course_id, utm_source, occupation, notes },
  });
  res.json(lead);
};

export const deleteLead = async (req: Request, res: Response) => {
  await prisma.lead.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};

export const convertLeadToClient = async (req: Request, res: Response) => {
  const lead = await prisma.lead.update({
    where: { id: Number(req.params.id) },
    data: { type: "Client" },
  });
  // Эзоҳ: Student на худкор сохта мешавад, зеро Student ба birth_date/gender ниёз дорад,
  // ки дар Lead вуҷуд надоранд. Пас аз ин, корбар донишҷӯро тавассути POST /students/enroll
  // (бо student_id холӣ, new_student пур) месозад ва ба гурӯҳ пайваст мекунад.
  res.json(lead);
};

export const transferLeads = async (req: Request, res: Response) => {
  const { lead_ids, target_course_id } = req.body;
  const result = await prisma.lead.updateMany({
    where: { id: { in: lead_ids } },
    data: { course_id: target_course_id },
  });
  res.json({ success: true, count: result.count });
};

export const exportLeads = async (req: Request, res: Response) => {
  const where = leadsWhere(req.query);
  const rows = await prisma.lead.findMany({ where, orderBy: { id: "desc" } });
  await exportToXlsx(
    res,
    rows,
    [
      { header: "Full name", key: "full_name" },
      { header: "Phone", key: "phone" },
      { header: "Course ID", key: "course_id" },
      { header: "UTM source", key: "utm_source" },
      { header: "Type", key: "type" },
    ],
    "leads"
  );
};

export const getCoupons = async (req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { id: "desc" } });
  res.json(coupons);
};

export const createCoupon = async (req: Request, res: Response) => {
  const { code, discount, lead_id } = req.body;
  const coupon = await prisma.coupon.create({ data: { code, discount, lead_id } });
  res.status(201).json(coupon);
};
