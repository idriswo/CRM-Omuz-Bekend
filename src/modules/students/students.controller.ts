import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";
import { AuthRequest } from "../../middlewares/auth.middleware";

function generatePassword() {
  return crypto.randomBytes(4).toString("hex"); // 8 аломат, масалан "a1b2c3d4"
}

// Сохтани login (User бо role=student) барои донишҷӯи нав, то ба система ворид шавад
async function createStudentLogin(studentId: number, phone: string) {
  const studentRole = await prisma.role.findFirst({ where: { name: "student" } });
  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser || !phone) return null;

  const plainPassword = generatePassword();
  const hashed = await bcrypt.hash(plainPassword, 10);
  await prisma.user.create({
    data: {
      phone,
      password: hashed,
      full_name: phone,
      role_id: studentRole?.id,
      student_id: studentId,
    },
  });
  return { phone, password: plainPassword };
}

export const getStudents = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const { search, course_id, group_id, status, contract_status } = req.query;

  const where: any = {};
  if (search)
    where.OR = [
      { first_name: { contains: String(search), mode: "insensitive" } },
      { last_name: { contains: String(search), mode: "insensitive" } },
    ];
  if (status) where.status = status;
  if (group_id) where.groups = { some: { id: Number(group_id) } };
  if (course_id) where.groups = { some: { course_id: Number(course_id) } };
  if (contract_status === "10_day_left") {
    const now = new Date();
    const in10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    where.contracts = { some: { end_date: { gte: now, lte: in10Days } } };
  }

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort_by as string]: sort_dir },
      include: { contracts: true, groups: true },
    }),
    prisma.student.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const getStudentById = async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { id: Number(req.params.id) },
    include: { contracts: true, groups: true, graduate_info: true },
  });
  if (!student) return res.status(404).json({ message: "Донишҷӯ ёфт нашуд" });
  res.json(student);
};

export const createStudent = async (req: Request, res: Response) => {
  const { first_name, last_name, birth_date, gender, address, email, phone, father_phone, status, branch_id } =
    req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : undefined;

  const student = await prisma.student.create({
    data: {
      first_name,
      last_name,
      birth_date: new Date(birth_date),
      gender,
      address,
      email,
      phone,
      father_phone,
      photo,
      status,
      branch_id: branch_id ? Number(branch_id) : undefined,
    },
  });

  // Login-и донишҷӯ худкор сохта мешавад, то дастрасии self-service дошта бошад
  const credentials = await createStudentLogin(student.id, phone);
  res.status(201).json({ student, login_credentials: credentials });
};

export const updateStudent = async (req: Request, res: Response) => {
  const { first_name, last_name, birth_date, gender, address, email, phone, father_phone, status, branch_id } =
    req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : undefined;

  let left_at: Date | null | undefined = undefined;
  if (status === "inactive") {
    const existing = await prisma.student.findUnique({ where: { id: Number(req.params.id) } });
    if (existing && existing.status !== "inactive") left_at = new Date();
  } else if (status) {
    left_at = null;
  }

  const student = await prisma.student.update({
    where: { id: Number(req.params.id) },
    data: {
      first_name,
      last_name,
      birth_date: birth_date ? new Date(birth_date) : undefined,
      gender,
      address,
      email,
      phone,
      father_phone,
      ...(photo ? { photo } : {}),
      status,
      left_at,
      branch_id: branch_id ? Number(branch_id) : undefined,
    },
  });
  res.json(student);
};

export const deleteStudent = async (req: Request, res: Response) => {
  await prisma.student.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};

export const getGraduates = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where: { status: "finished" },
      skip,
      take: limit,
      orderBy: { [sort_by as string]: sort_dir },
      include: { graduate_info: true },
    }),
    prisma.student.count({ where: { status: "finished" } }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const updateGraduate = async (req: Request, res: Response) => {
  const studentId = Number(req.params.id);
  const { work_place, has_certificate, tag } = req.body;

  const graduateInfo = await prisma.graduateInfo.upsert({
    where: { student_id: studentId },
    update: { work_place, has_certificate, tag },
    create: { student_id: studentId, work_place, has_certificate, tag },
  });
  res.json(graduateInfo);
};

export const getGraduatesStats = async (_req: Request, res: Response) => {
  const stats = await prisma.graduateInfo.groupBy({
    by: ["tag"],
    _count: { _all: true },
  });
  res.json(stats);
};

export const enrollStudent = async (req: Request, res: Response) => {
  const { student_id, group_id, new_student } = req.body;
  let studentId = student_id;

  if (!studentId && new_student) {
    const created = await prisma.student.create({
      data: { ...new_student, birth_date: new Date(new_student.birth_date) },
    });
    studentId = created.id;
  }

  await prisma.group.update({
    where: { id: group_id },
    data: { students: { connect: { id: studentId } } },
  });
  res.json({ success: true, student_id: studentId });
};

// ===== Self-service (role=student) — фақат маълумоти худашро мебинад =====

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { id: req.user!.student_id },
    include: { groups: true, graduate_info: true },
  });
  if (!student) return res.status(404).json({ message: "Профил ёфт нашуд" });
  res.json(student);
};

export const getMyGroups = async (req: AuthRequest, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { id: req.user!.student_id },
    include: { groups: { include: { course: true } } },
  });
  res.json(student?.groups ?? []);
};

export const getMyGroupmates = async (req: AuthRequest, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { id: req.user!.student_id },
    include: { groups: { include: { students: true } } },
  });
  const groupmates = (student?.groups ?? []).map((g) => ({
    group_id: g.id,
    group_name: g.name,
    students: g.students.filter((s) => s.id !== req.user!.student_id),
  }));
  res.json(groupmates);
};

export const getMyScores = async (req: AuthRequest, res: Response) => {
  const entries = await prisma.journalEntry.findMany({
    where: { student_id: req.user!.student_id },
    include: { week: { include: { group: true } } },
    orderBy: { day_date: "desc" },
  });
  res.json(entries);
};

export const getMyCoins = async (req: AuthRequest, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { id: req.user!.student_id },
    include: { coin_transactions: { orderBy: { created_at: "desc" } } },
  });
  if (!student) return res.status(404).json({ message: "Профил ёфт нашуд" });
  res.json({ balance: student.coin_balance, transactions: student.coin_transactions });
};

// ===== Coin: дидан/иловаи дастӣ/харҷ (admin/superadmin/director, ё худи донишҷӯ барои дидан) =====

export const getStudentCoins = async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { id: Number(req.params.id) },
    include: { coin_transactions: { orderBy: { created_at: "desc" } } },
  });
  if (!student) return res.status(404).json({ message: "Донишҷӯ ёфт нашуд" });
  res.json({ balance: student.coin_balance, transactions: student.coin_transactions });
};

export const addCoins = async (req: AuthRequest, res: Response) => {
  const studentId = Number(req.params.id);
  const { amount, reason } = req.body;
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ message: "amount бояд мусбат бошад" });

  const [, student] = await prisma.$transaction([
    prisma.coinTransaction.create({
      data: { student_id: studentId, amount: amt, type: "manual", reason, created_by: req.user!.id },
    }),
    prisma.student.update({ where: { id: studentId }, data: { coin_balance: { increment: amt } } }),
  ]);
  res.status(201).json({ balance: student.coin_balance });
};

export const spendCoins = async (req: AuthRequest, res: Response) => {
  const studentId = Number(req.params.id);
  const { amount, reason } = req.body;
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ message: "amount бояд мусбат бошад" });

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return res.status(404).json({ message: "Донишҷӯ ёфт нашуд" });
  if (student.coin_balance < amt) return res.status(400).json({ message: "Coin кофӣ нест" });

  const [, updated] = await prisma.$transaction([
    prisma.coinTransaction.create({
      data: { student_id: studentId, amount: -amt, type: "spend", reason, created_by: req.user!.id },
    }),
    prisma.student.update({ where: { id: studentId }, data: { coin_balance: { decrement: amt } } }),
  ]);
  res.json({ balance: updated.coin_balance });
};

// ===== Graduates: гурӯҳбандӣ ва як хатмкунандаи муайян =====

export const getGraduateGroups = async (_req: Request, res: Response) => {
  const groups = await prisma.group.findMany({
    where: { students: { some: { status: "finished" } } },
    include: { course: true, students: { where: { status: "finished" } } },
  });
  res.json(
    groups.map((g) => ({
      group_id: g.id,
      group_name: g.name,
      course_name: g.course.name,
      graduates_count: g.students.length,
    }))
  );
};

export const getGraduateById = async (req: Request, res: Response) => {
  const student = await prisma.student.findFirst({
    where: { id: Number(req.params.id), status: "finished" },
    include: { graduate_info: true, groups: { include: { course: true } } },
  });
  if (!student) return res.status(404).json({ message: "Хатмкунанда ёфт нашуд" });
  res.json(student);
};

// ===== Leaders — рейтинги донишҷӯён аз рӯи coin =====

export const getLeaders = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where: { status: "active" },
      skip,
      take: limit,
      orderBy: { coin_balance: "desc" },
    }),
    prisma.student.count({ where: { status: "active" } }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const getLeadersWinners = async (_req: Request, res: Response) => {
  const winners = await prisma.student.findMany({
    where: { status: "active" },
    orderBy: { coin_balance: "desc" },
    take: 3,
  });
  res.json(winners);
};

// ===== Left courses — саҳифаи пурра (рӯйхат/chart/гурӯҳ) =====

export const getLeftCoursesList = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const where = { status: "inactive" };

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort_by === "id" ? "left_at" : (sort_by as string)]: sort_dir },
      include: { groups: { include: { course: true } } },
    }),
    prisma.student.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

export const getLeftCoursesChart = async (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const students = await prisma.student.findMany({
    where: { status: "inactive", left_at: { gte: start, lt: end } },
    select: { left_at: true },
  });

  const result: Record<number, number> = {};
  for (const s of students) {
    if (!s.left_at) continue;
    const month = s.left_at.getMonth() + 1;
    result[month] = (result[month] || 0) + 1;
  }
  res.json(result);
};

export const getLeftCoursesGroups = async (_req: Request, res: Response) => {
  const groups = await prisma.group.findMany({
    include: { course: true, students: { where: { status: "inactive" } } },
  });
  res.json(
    groups
      .filter((g) => g.students.length > 0)
      .map((g) => ({ group_id: g.id, group_name: g.name, course_name: g.course.name, left_count: g.students.length }))
  );
};

// ===== Student activity — сабтҳои охирини амал (аз Log) =====

export const getStudentActivity = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const where = { entity: { in: ["Student", "JournalEntry", "Coin"] } };

  const [data, total] = await Promise.all([
    prisma.log.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: { user: { select: { id: true, full_name: true } } },
    }),
    prisma.log.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};

// ===== Enroll chart =====

export const getEnrollChart = async (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const students = await prisma.student.findMany({
    where: { created_at: { gte: start, lt: end } },
    select: { created_at: true },
  });

  const result: Record<number, number> = {};
  for (const s of students) {
    const month = s.created_at.getMonth() + 1;
    result[month] = (result[month] || 0) + 1;
  }
  res.json(result);
};
