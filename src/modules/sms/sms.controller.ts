import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope, buildOrderBy } from "../../utils/pagination";
import { smsProvider } from "../../utils/smsProvider";

const SORTABLE = ["id", "title", "sent_at"] as const;

const RECIPIENT_TYPES = ["Student", "Lead", "Employee", "Graduate"] as const;
type RecipientType = (typeof RECIPIENT_TYPES)[number];

const MAX_MESSAGE_LENGTH = 1000;
// Ба провайдер якбора ҳазор дархост фиристодан мумкин нест — бо порсияҳо меравад
const SEND_CHUNK_SIZE = 20;

/**
 * ⚠️ recipient_ids ҳатман бояд массиви ғайрихолӣ бошад.
 * Агар undefined гузарад, Prisma филтри `in`-ро мепартояд ва findMany
 * ҲАМАИ сатрҳоро бармегардонад — яъне SMS ба тамоми база меравад.
 * Даъваткунанда (sendSms) инро пеш аз ин ҷо тафтиш мекунад.
 */
async function getPhonesByType(recipient_type: RecipientType, recipient_ids: number[]): Promise<string[]> {
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
  }
}

// ===== Recipients — рӯйхати ретсипиентҳо барои интихоб дар frontend (id, ном, телефон) =====

export const getRecipientsByGroup = async (req: Request, res: Response) => {
  const groupId = Number(req.query.group_id);
  const students = await prisma.student.findMany({ where: { groups: { some: { id: groupId } } } });
  res.json(students.map((s) => ({ id: s.id, full_name: `${s.first_name} ${s.last_name}`, phone: s.phone })));
};

export const getRecipientsStudents = async (_req: Request, res: Response) => {
  const students = await prisma.student.findMany();
  res.json(students.map((s) => ({ id: s.id, full_name: `${s.first_name} ${s.last_name}`, phone: s.phone })));
};

export const getRecipientsMentors = async (_req: Request, res: Response) => {
  const employees = await prisma.employee.findMany();
  res.json(employees.map((e) => ({ id: e.id, full_name: `${e.first_name} ${e.last_name}`, phone: e.phone })));
};

export const getRecipientsLeads = async (_req: Request, res: Response) => {
  const leads = await prisma.lead.findMany();
  res.json(leads.map((l) => ({ id: l.id, full_name: l.full_name, phone: l.phone })));
};

export const getRecipientsGraduates = async (_req: Request, res: Response) => {
  const graduates = await prisma.student.findMany({ where: { status: "finished" } });
  res.json(graduates.map((s) => ({ id: s.id, full_name: `${s.first_name} ${s.last_name}`, phone: s.phone })));
};

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
  const { recipient_type, recipient_ids, template_id, text } = req.body ?? {};

  if (!RECIPIENT_TYPES.includes(recipient_type)) {
    return res
      .status(400)
      .json({ message: `recipient_type бояд яке аз инҳо бошад: ${RECIPIENT_TYPES.join(", ")}` });
  }

  // Бе ин тафтиш undefined ба маънои «ба ҳама фирист» кор мекард
  if (!Array.isArray(recipient_ids) || recipient_ids.length === 0) {
    return res.status(400).json({ message: "recipient_ids бояд массиви ғайрихолии id бошад" });
  }
  const ids = recipient_ids.map(Number);
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    return res.status(400).json({ message: "recipient_ids бояд танҳо аз id-и бутуни мусбат иборат бошад" });
  }

  // Матн: ё бевосита, ё аз шаблон
  let message: string | undefined;
  if (typeof text === "string" && text.trim()) {
    message = text.trim();
  } else if (template_id !== undefined) {
    const templateId = Number(template_id);
    if (!Number.isInteger(templateId) || templateId <= 0) {
      return res.status(400).json({ message: "template_id нодуруст аст" });
    }
    const template = await prisma.smsTemplate.findUnique({ where: { id: templateId } });
    // Пеш дар ин ҳолат «text ё template_id лозим аст» бармегашт, ки гумроҳкунанда буд
    if (!template) return res.status(404).json({ message: "Шаблон ёфт нашуд" });
    message = template.description;
  }

  if (!message) return res.status(400).json({ message: "text ё template_id лозим аст" });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ message: `Матн аз ${MAX_MESSAGE_LENGTH} аломат дароз аст` });
  }

  // Рақамҳои холӣ партофта, такрориҳо як карда мешаванд —
  // вагарна як нафар метавонад ду SMS гирад (масалан ҳамчун Student ва Graduate)
  const phones = [...new Set((await getPhonesByType(recipient_type, ids)).filter((p) => p?.trim()))];
  if (phones.length === 0) {
    return res.status(404).json({ message: "Барои ин id-ҳо рақами телефон ёфт нашуд" });
  }

  // allSettled — хатои як рақам набояд фиристодани боқимондаро бекор кунад.
  // Пеш Promise.all буд: як хатои провайдер тамоми дархостро ба 500 мебурд,
  // дар ҳоле ки як қисми SMS аллакай фиристода шуда буд.
  let sent = 0;
  const failed: string[] = [];
  for (let i = 0; i < phones.length; i += SEND_CHUNK_SIZE) {
    const chunk = phones.slice(i, i + SEND_CHUNK_SIZE);
    const results = await Promise.allSettled(chunk.map((phone) => smsProvider.send(phone, message!)));
    results.forEach((result, index) => {
      if (result.status === "fulfilled") sent++;
      else failed.push(chunk[index]);
    });
  }

  if (sent > 0) await prisma.smsHistory.create({ data: { title: message.slice(0, 50) } });

  res.json({
    success: failed.length === 0,
    sent_count: sent,
    failed_count: failed.length,
    recipients_count: phones.length,
  });
};

export const getSmsHistory = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);

  const [data, total] = await Promise.all([
    prisma.smsHistory.findMany({ skip, take: limit, orderBy: buildOrderBy(sort_by, sort_dir, SORTABLE) }),
    prisma.smsHistory.count(),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};
