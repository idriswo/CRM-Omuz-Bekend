import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";
import { smsProvider } from "../../utils/smsProvider";

async function getPhonesByType(recipient_type: string, recipient_ids: number[]): Promise<string[]> {
  switch (recipient_type) {
    case "Student": {
      const students = await prisma.student.findMany({ where: { id: { in: recipient_ids } } });
      return students.map((s) => s.phone);
    }
    case "Lead": {
      const leads = await prisma.lead.findMany({ where: { id: { in: recipient_ids } } });
      return leads.map((l) => l.phone);
    }
    case "Employee": {
      const employees = await prisma.employee.findMany({ where: { id: { in: recipient_ids } } });
      return employees.map((e) => e.phone);
    }
    case "Graduate": {
      const graduates = await prisma.student.findMany({
        where: { id: { in: recipient_ids }, status: "finished" },
      });
      return graduates.map((s) => s.phone);
    }
    default:
      return [];
  }
}

export const getSmsTemplates = async (_req: Request, res: Response) => {
  const templates = await prisma.smsTemplate.findMany({ orderBy: { id: "desc" } });
  res.json(templates);
};

export const createSmsTemplate = async (req: Request, res: Response) => {
  const { title, description } = req.body;
  const template = await prisma.smsTemplate.create({ data: { title, description } });
  res.status(201).json(template);
};

export const updateSmsTemplate = async (req: Request, res: Response) => {
  const { title, description } = req.body;
  const template = await prisma.smsTemplate.update({
    where: { id: Number(req.params.id) },
    data: { title, description },
  });
  res.json(template);
};

export const deleteSmsTemplate = async (req: Request, res: Response) => {
  await prisma.smsTemplate.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};

export const sendSms = async (req: Request, res: Response) => {
  const { recipient_type, recipient_ids, template_id, text } = req.body;
  const phones = await getPhonesByType(recipient_type, recipient_ids);

  const message = text || (template_id && (await prisma.smsTemplate.findUnique({ where: { id: Number(template_id) } }))?.description);
  if (!message) return res.status(400).json({ message: "text ё template_id лозим аст" });

  await Promise.all(phones.map((phone) => smsProvider.send(phone, message)));
  await prisma.smsHistory.create({ data: { title: message.slice(0, 50) } });

  res.json({ success: true, sent_count: phones.length });
};

export const getSmsHistory = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);

  const [data, total] = await Promise.all([
    prisma.smsHistory.findMany({ skip, take: limit, orderBy: { [sort_by as string]: sort_dir } }),
    prisma.smsHistory.count(),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};
