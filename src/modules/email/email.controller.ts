import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope, buildOrderBy } from "../../utils/pagination";
import { sendEmail, plainEmail, mailEnabled } from "../../utils/mailer";
import { normalizeEmail } from "../../utils/email";
import { toId } from "../../utils/input";

const SORTABLE = ["id", "title", "recipients", "failed", "sent_at"] as const;

const RECIPIENT_TYPES = ["Student", "Employee", "Graduate"] as const;
type RecipientType = (typeof RECIPIENT_TYPES)[number];

const MAX_SUBJECT_LENGTH = 200;
const MAX_BODY_LENGTH = 5000;
// Gmail SMTP-ро якбора бо садҳо дархост пур кардан мумкин нест
const SEND_CHUNK_SIZE = 10;

/**
 * ⚠️ recipient_ids ҳатман бояд массиви ғайрихолӣ бошад.
 * Агар undefined гузарад, Prisma филтри `in`-ро мепартояд ва findMany
 * ҲАМАИ сатрҳоро бармегардонад — яъне паём ба тамоми база меравад.
 * Даъваткунанда (sendBulkEmail) инро пеш аз ин ҷо тафтиш мекунад.
 */
async function getEmailsByType(recipient_type: RecipientType, recipient_ids: number[]) {
  switch (recipient_type) {
    case "Student": {
      const students = await prisma.student.findMany({ where: { id: { in: recipient_ids } } });
      return students.map((s) => s.email);
    }
    case "Employee": {
      const employees = await prisma.employee.findMany({ where: { id: { in: recipient_ids } } });
      return employees.map((e) => e.email);
    }
    case "Graduate": {
      const graduates = await prisma.student.findMany({
        where: { id: { in: recipient_ids }, status: "finished" },
      });
      return graduates.map((s) => s.email);
    }
  }
}

// ===== Recipients — рӯйхат барои интихоб дар frontend =====
// Танҳо онҳое, ки email доранд: вагарна корбар касеро интихоб мекард,
// ки паём ҳеҷ гоҳ ба ӯ намерасад.

const HAS_EMAIL = { email: { not: null } } as const;

const recipientDto = (r: { id: number; email: string | null }, full_name: string) => ({
  id: r.id,
  full_name,
  email: r.email,
});

export const getRecipientsByGroup = async (req: Request, res: Response) => {
  const groupId = toId(req.query.group_id);
  if (!groupId) return res.status(400).json({ message: "group_id ҳатмист" });

  const students = await prisma.student.findMany({
    where: { groups: { some: { id: groupId } }, ...HAS_EMAIL },
  });
  res.json(students.map((s) => recipientDto(s, `${s.first_name} ${s.last_name}`)));
};

export const getRecipientsStudents = async (_req: Request, res: Response) => {
  const students = await prisma.student.findMany({ where: HAS_EMAIL });
  res.json(students.map((s) => recipientDto(s, `${s.first_name} ${s.last_name}`)));
};

export const getRecipientsMentors = async (_req: Request, res: Response) => {
  const employees = await prisma.employee.findMany({ where: HAS_EMAIL });
  res.json(employees.map((e) => recipientDto(e, `${e.first_name} ${e.last_name}`)));
};

export const getRecipientsGraduates = async (_req: Request, res: Response) => {
  const graduates = await prisma.student.findMany({ where: { status: "finished", ...HAS_EMAIL } });
  res.json(graduates.map((s) => recipientDto(s, `${s.first_name} ${s.last_name}`)));
};

// ===== Шаблонҳо =====

export const getEmailTemplates = async (_req: Request, res: Response) => {
  const templates = await prisma.emailTemplate.findMany({ orderBy: { id: "desc" } });
  res.json(templates);
};

export const createEmailTemplate = async (req: Request, res: Response) => {
  const { title, description } = req.body ?? {};
  if (!title || !description) {
    return res.status(400).json({ message: "title ва description ҳатмист" });
  }
  const template = await prisma.emailTemplate.create({ data: { title, description } });
  res.status(201).json(template);
};

export const updateEmailTemplate = async (req: Request, res: Response) => {
  const { title, description } = req.body ?? {};
  const template = await prisma.emailTemplate.update({
    where: { id: Number(req.params.id) },
    data: { title, description },
  });
  res.json(template);
};

export const deleteEmailTemplate = async (req: Request, res: Response) => {
  await prisma.emailTemplate.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};

// ===== Фиристодан =====

export const sendBulkEmail = async (req: Request, res: Response) => {
  const { recipient_type, recipient_ids, template_id, subject, text } = req.body ?? {};

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
  let body: string | undefined;
  let title: string | undefined;
  if (typeof text === "string" && text.trim()) {
    body = text.trim();
    title = typeof subject === "string" && subject.trim() ? subject.trim() : "Паём аз Omuz CRM";
  } else if (template_id !== undefined) {
    const templateId = toId(template_id);
    if (!templateId) return res.status(400).json({ message: "template_id нодуруст аст" });

    const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
    if (!template) return res.status(404).json({ message: "Шаблон ёфт нашуд" });
    body = template.description;
    title = template.title;
  }

  if (!body || !title) return res.status(400).json({ message: "text ё template_id лозим аст" });
  if (title.length > MAX_SUBJECT_LENGTH) {
    return res.status(400).json({ message: `subject аз ${MAX_SUBJECT_LENGTH} аломат дароз аст` });
  }
  if (body.length > MAX_BODY_LENGTH) {
    return res.status(400).json({ message: `Матн аз ${MAX_BODY_LENGTH} аломат дароз аст` });
  }

  // Суроғаҳои нодуруст партофта, такрориҳо як карда мешаванд — вагарна як
  // нафар метавонад ду паём гирад (масалан ҳамчун Student ва ҳамчун Graduate)
  const raw = await getEmailsByType(recipient_type, ids);
  const recipients = [...new Set(raw.map(normalizeEmail).filter((e): e is string => Boolean(e)))];

  if (recipients.length === 0) {
    return res.status(404).json({ message: "Барои ин id-ҳо суроғаи email ёфт нашуд" });
  }

  // allSettled — хатои як суроға набояд фиристодани боқимондаро бекор кунад
  let sent = 0;
  const failed: string[] = [];
  for (let i = 0; i < recipients.length; i += SEND_CHUNK_SIZE) {
    const chunk = recipients.slice(i, i + SEND_CHUNK_SIZE);
    const results = await Promise.allSettled(
      chunk.map((to) => sendEmail(plainEmail({ to, subject: title!, body: body! })))
    );
    results.forEach((result, index) => {
      if (result.status === "fulfilled") sent++;
      else failed.push(chunk[index]);
    });
  }

  if (sent > 0) {
    await prisma.emailHistory.create({
      data: { title: title.slice(0, 200), recipients: recipients.length, failed: failed.length },
    });
  }

  res.json({
    success: failed.length === 0,
    sent_count: sent,
    failed_count: failed.length,
    recipients_count: recipients.length,
    // Дар режими stub паём воқеан намеравад — фронтенд бояд инро нишон диҳад
    mail_enabled: mailEnabled(),
  });
};

export const getEmailHistory = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);

  const [data, total] = await Promise.all([
    prisma.emailHistory.findMany({ skip, take: limit, orderBy: buildOrderBy(sort_by, sort_dir, SORTABLE) }),
    prisma.emailHistory.count(),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};
