import { Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope, buildOrderBy } from "../../utils/pagination";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { ROLE_CREATE_MATRIX, RoleName } from "../../constants/roles";
import { normalizePhone } from "../../utils/phone";
import { normalizeEmail } from "../../utils/email";
import { toId } from "../../utils/input";
import { generateTempPassword } from "../../utils/password";
import { sendEmail, credentialsEmail } from "../../utils/mailer";

const SORTABLE = ["id", "email", "full_name", "created_at"] as const;

const safeUser = (u: any) => {
  const {
    password,
    refresh_token,
    reset_code,
    reset_code_expires,
    reset_code_attempts,
    reset_token,
    reset_token_expires,
    ...rest
  } = u;
  return rest;
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const { search, role_id, branch_id } = req.query;

  const where: any = {};
  if (search) where.full_name = { contains: String(search), mode: "insensitive" };
  if (role_id) where.role_id = Number(role_id);
  if (branch_id) where.branch_id = Number(branch_id);

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy(sort_by, sort_dir, SORTABLE),
      include: { role: true },
    }),
    prisma.user.count({ where }),
  ]);

  res.json(buildEnvelope(data.map(safeUser), total, page, limit));
};

export const createUser = async (req: AuthRequest, res: Response) => {
  const { email, phone, password, full_name, role_id, branch_id, employee_id } = req.body ?? {};

  // email логини вуруд аст — бинобар ин ҳамон нормализатсияе мегузарад,
  // ки login истифода мебарад (auth.controller.ts)
  const emailValue = normalizeEmail(email);
  if (!emailValue) {
    return res
      .status(400)
      .json({ message: `Email нодуруст аст: "${email}". Намуна: salim@gmail.com` });
  }
  // phone акнун ихтиёрӣ ва танҳо барои алоқа аст — вале агар омада бошад, бояд дуруст бошад
  if (phone !== undefined && phone !== null && phone !== "" && !normalizePhone(phone)) {
    return res.status(400).json({ message: `Рақами телефон нодуруст аст: "${phone}"` });
  }
  // password ихтиёрӣ аст: агар наомада бошад, система худаш месозад ва бо email
  // мефиристад. Ин роҳи асосист — парол дар чат/лог намемонад.
  if (password !== undefined && (typeof password !== "string" || password.length < 8)) {
    return res.status(400).json({ message: "Парол бояд на камтар аз 8 аломат бошад" });
  }
  if (!full_name) return res.status(400).json({ message: "full_name ҳатмист" });

  const targetRole = await prisma.role.findUnique({ where: { id: Number(role_id) } });
  const requesterRole = req.user!.role as RoleName;
  const allowed = ROLE_CREATE_MATRIX[requesterRole] || [];
  if (!targetRole || !allowed.includes(targetRole.name as RoleName)) {
    return res.status(403).json({ message: `Шумо ҳуқуқ надоред нақши "${targetRole?.name}"-ро созед` });
  }

  // Барои mentor: пайванд ба сабти кадрии Employee, то ҷадвали дарсҳои
  // худашро бинад (TimetableEntry.mentor_id ба Employee ишора мекунад)
  const employeeId = toId(employee_id);
  if (employee_id !== undefined && !employeeId) {
    return res.status(400).json({ message: "employee_id нодуруст аст" });
  }
  if (employeeId) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId }, include: { user: true } });
    if (!employee) return res.status(404).json({ message: "Корманд ёфт нашуд" });
    if (employee.user) return res.status(409).json({ message: "Ин корманд аллакай ҳисоб дорад" });
  }

  const generated = password === undefined;
  const plainPassword = generated ? generateTempPassword() : (password as string);
  const hashed = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.create({
    data: {
      email: emailValue,
      phone: normalizePhone(phone),
      password: hashed,
      full_name,
      role_id: Number(role_id),
      branch_id: branch_id ? Number(branch_id) : undefined,
      employee_id: employeeId,
      // Пароли сохташуда тавассути email меравад — то ивази он ҳисоб маҳдуд аст
      must_change_password: generated,
    },
  });

  // Ноком шудани email набояд сохтани ҳисобро бекор кунад — корбар аллакай
  // сохта шуд ва credential дар ҷавоб бармегардад, то корманд онро дастӣ диҳад.
  let email_sent = false;
  let email_error: string | undefined;
  try {
    await sendEmail(credentialsEmail({ full_name, email: emailValue, password: plainPassword }));
    email_sent = true;
  } catch (err) {
    email_error = err instanceof Error ? err.message : String(err);
    console.error(`[users] email ба ${emailValue} нарасид:`, email_error);
  }

  res.status(201).json({
    ...safeUser(user),
    email_sent,
    ...(email_error ? { email_error } : {}),
    // Парол танҳо ҳамин як бор нишон дода мешавад — дар база hash аст
    login_credentials: { email: emailValue, password: plainPassword },
  });
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  const { email, phone, full_name, role_id, branch_id, employee_id } = req.body ?? {};

  // email логин аст — иваз кардани он мумкин, вале бояд дуруст бошад
  if (email !== undefined && !normalizeEmail(email)) {
    return res.status(400).json({ message: `Email нодуруст аст: "${email}"` });
  }
  if (phone !== undefined && phone !== null && phone !== "" && !normalizePhone(phone)) {
    return res.status(400).json({ message: `Рақами телефон нодуруст аст: "${phone}"` });
  }

  if (role_id) {
    const targetRole = await prisma.role.findUnique({ where: { id: Number(role_id) } });
    const requesterRole = req.user!.role as RoleName;
    const allowed = ROLE_CREATE_MATRIX[requesterRole] || [];
    if (!targetRole || !allowed.includes(targetRole.name as RoleName)) {
      return res.status(403).json({ message: `Шумо ҳуқуқ надоред нақши "${targetRole?.name}"-ро таъин кунед` });
    }
  }

  const user = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: {
      email: normalizeEmail(email),
      phone: normalizePhone(phone),
      employee_id: toId(employee_id),
      full_name,
      role_id: role_id ? Number(role_id) : undefined,
      branch_id: branch_id ? Number(branch_id) : undefined,
    },
  });
  res.json(safeUser(user));
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const target = await prisma.user.findUnique({ where: { id: Number(req.params.id) }, include: { role: true } });
  if (!target) return res.status(404).json({ message: "Корбар ёфт нашуд" });

  const requesterRole = req.user!.role as RoleName;
  const allowed = ROLE_CREATE_MATRIX[requesterRole] || [];
  if (!target.role || !allowed.includes(target.role.name as RoleName)) {
    return res.status(403).json({ message: `Шумо ҳуқуқ надоред нақши "${target.role?.name}"-ро нест кунед` });
  }

  await prisma.user.delete({ where: { id: target.id } });
  res.json({ success: true });
};

// toggleCanAddStudents нест карда шуд — ниг. эзоҳ дар administration.routes.ts
