import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  studentDto,
  studentInclude,
  fullName,
  ageFrom,
  fmtDate,
  fmtPeriod,
  mentorName,
} from "../../utils/serialize";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function generatePassword() {
  return crypto.randomBytes(4).toString("hex"); // 8 аломат, масалан "a1b2c3d4"
}

// Сохтани login (User бо role=student) барои донишҷӯи нав, то ба система ворид шавад
async function createStudentLogin(studentId: number, phone: string, full_name?: string) {
  const studentRole = await prisma.role.findFirst({ where: { name: "student" } });
  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser || !phone) return null;

  const plainPassword = generatePassword();
  const hashed = await bcrypt.hash(plainPassword, 10);
  await prisma.user.create({
    data: {
      phone,
      password: hashed,
      full_name: full_name || phone,
      role_id: studentRole?.id,
      student_id: studentId,
    },
  });
  return { phone, password: plainPassword };
}

/** Майдонҳои умумии body-и донишҷӯ (ҳам JSON, ҳам multipart). */
function studentBody(req: Request) {
  const b = req.body ?? {};
  let phones = b.phones;
  if (typeof phones === "string") {
    try {
      phones = JSON.parse(phones);
    } catch {
      phones = undefined;
    }
  }
  // сурат: ё файл (multipart), ё сатри data-url/URL (JSON)
  const photo = req.file ? `/uploads/${req.file.filename}` : typeof b.photo === "string" ? b.photo : undefined;

  return {
    first_name: b.first_name,
    last_name: b.last_name,
    birth_date: b.birth_date ? new Date(b.birth_date) : undefined,
    gender: b.gender,
    address: b.address,
    email: b.email,
    phone: b.phone,
    father_phone: b.father_phone ?? (Array.isArray(phones) ? phones[1]?.number : undefined),
    phones: Array.isArray(phones) ? phones : undefined,
    telegram_username: b.telegram_username,
    description: b.description,
    is_top: b.is_top === undefined ? undefined : b.is_top === true || b.is_top === "true",
    status: b.status,
    left_reason: b.left_reason,
    branch_id: b.branch_id ? Number(b.branch_id) : undefined,
    photo,
  };
}

/** where барои филтри contract_status (active | 10_day_left | finished). */
function contractWhere(status?: string) {
  if (!status) return {};
  const now = new Date();
  const in10 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  if (status === "10_day_left")
    return { contracts: { some: { end_date: { gte: now, lte: in10 } } } };
  if (status === "finished")
    return { AND: [{ contracts: { some: {} } }, { contracts: { every: { end_date: { lt: now } } } }] };
  // active: ё шартнома надорад, ё шартномааш зиёда аз 10 рӯз эътибор дорад
  return {
    OR: [{ contracts: { none: {} } }, { contracts: { some: { end_date: { gt: in10 } } } }],
  };
}

export const getStudents = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const { search, course_id, group_id, status, contract_status } = req.query;

  const and: any[] = [];
  if (search)
    and.push({
      OR: [
        { first_name: { contains: String(search), mode: "insensitive" } },
        { last_name: { contains: String(search), mode: "insensitive" } },
        { phone: { contains: String(search) } },
      ],
    });
  if (status) and.push({ status: String(status) });
  if (group_id) and.push({ groups: { some: { id: Number(group_id) } } });
  if (course_id) and.push({ groups: { some: { course_id: Number(course_id) } } });
  if (contract_status) and.push(contractWhere(String(contract_status)));

  const where = and.length ? { AND: and } : {};
  const orderBy = ["id", "first_name", "last_name", "created_at", "status"].includes(String(sort_by))
    ? { [String(sort_by)]: sort_dir }
    : { id: sort_dir };

  const [data, total] = await Promise.all([
    prisma.student.findMany({ where, skip, take: limit, orderBy, include: studentInclude }),
    prisma.student.count({ where }),
  ]);

  res.json(buildEnvelope(data.map(studentDto), total, page, limit));
};

export const getStudentById = async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { id: Number(req.params.id) },
    include: { ...studentInclude, graduate_info: true },
  });
  if (!student) return res.status(404).json({ message: "Донишҷӯ ёфт нашуд" });
  res.json(studentDto(student));
};

export const createStudent = async (req: Request, res: Response) => {
  const b = studentBody(req);
  if (!b.first_name || !b.last_name || !b.phone)
    return res.status(400).json({ message: "first_name, last_name ва phone ҳатмист" });

  const student = await prisma.student.create({
    data: {
      first_name: b.first_name,
      last_name: b.last_name,
      birth_date: b.birth_date ?? new Date("2000-01-01"),
      gender: b.gender ?? "male",
      address: b.address,
      email: b.email,
      phone: b.phone,
      father_phone: b.father_phone,
      phones: b.phones ?? undefined,
      telegram_username: b.telegram_username,
      description: b.description,
      is_top: b.is_top ?? false,
      photo: b.photo,
      status: b.status ?? "active",
      branch_id: b.branch_id,
    },
  });

  // Account худкор сохта намешавад — сутуни ACCOUNT «No» мемонад ва
  // корманд онро бо тугмаи Invite (POST /students/:id/invite) месозад.
  const credentials =
    req.body?.create_account === true || req.body?.create_account === "true"
      ? await createStudentLogin(student.id, b.phone, fullName(student))
      : null;
  const created = await prisma.student.findUnique({
    where: { id: student.id },
    include: studentInclude,
  });
  res.status(201).json({ ...studentDto(created), login_credentials: credentials });
};

export const updateStudent = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const b = studentBody(req);

  let left_at: Date | null | undefined = undefined;
  if (b.status === "inactive") {
    const existing = await prisma.student.findUnique({ where: { id } });
    if (existing && existing.status !== "inactive") left_at = new Date();
  } else if (b.status) {
    left_at = null;
  }

  await prisma.student.update({
    where: { id },
    data: {
      first_name: b.first_name,
      last_name: b.last_name,
      birth_date: b.birth_date,
      gender: b.gender,
      address: b.address,
      email: b.email,
      phone: b.phone,
      father_phone: b.father_phone,
      ...(b.phones ? { phones: b.phones } : {}),
      telegram_username: b.telegram_username,
      description: b.description,
      ...(b.is_top === undefined ? {} : { is_top: b.is_top }),
      ...(b.photo ? { photo: b.photo } : {}),
      status: b.status,
      left_reason: b.left_reason,
      left_at,
      branch_id: b.branch_id,
    },
  });

  const student = await prisma.student.findUnique({ where: { id }, include: studentInclude });
  res.json(studentDto(student));
};

export const deleteStudent = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  // Пеш аз нест кардан ҳамаи вобастагиҳо тоза мешаванд, вагарна FK хато медиҳад
  await prisma.$transaction([
    prisma.coinTransaction.deleteMany({ where: { student_id: id } }),
    prisma.journalEntry.deleteMany({ where: { student_id: id } }),
    prisma.contract.deleteMany({ where: { student_id: id } }),
    prisma.debtor.deleteMany({ where: { student_id: id } }),
    prisma.payment.deleteMany({ where: { student_id: id } }),
    prisma.graduateInfo.deleteMany({ where: { student_id: id } }),
    prisma.user.deleteMany({ where: { student_id: id } }),
    prisma.student.update({ where: { id }, data: { groups: { set: [] } } }),
    prisma.student.delete({ where: { id } }),
  ]);
  res.json({ success: true });
};

/** Сохтани account барои донишҷӯ (тугмаи «Invite» дар student info sheet). */
export const inviteStudentAccount = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { email } = req.body ?? {};

  const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
  if (!student) return res.status(404).json({ message: "Донишҷӯ ёфт нашуд" });
  if (student.user) return res.status(409).json({ message: "Ин донишҷӯ аллакай account дорад" });

  if (email) await prisma.student.update({ where: { id }, data: { email } });
  const credentials = await createStudentLogin(id, student.phone, fullName(student));
  if (!credentials)
    return res.status(409).json({ message: "Бо ин рақами телефон корбар аллакай мавҷуд аст" });

  res.status(201).json({ success: true, login_credentials: credentials });
};

// ===== Graduates =====

const graduateDto = (s: any) => {
  const group = (s.groups ?? [])[0];
  const year = (group?.end_date ?? s.created_at ?? new Date()).getFullYear();
  return {
    id: s.id,
    full_name: fullName(s),
    age: ageFrom(s.birth_date),
    group: group?.name ?? "",
    date_of_issue: fmtDate(group?.end_date ?? s.created_at),
    work_place: s.graduate_info?.work_place ?? "",
    serial: `#Ud${year} ${String(s.id).padStart(2, "0")}`,
    has_certificate: Boolean(s.graduate_info?.has_certificate),
    tag: s.graduate_info?.tag ?? "OpenToWork",
    photo: s.photo ?? null,
  };
};

const graduateInclude = { graduate_info: true, groups: { include: { course: true } } } as const;

function graduateWhere(query: any) {
  const and: any[] = [{ status: "finished" }];
  if (query.search)
    and.push({
      OR: [
        { first_name: { contains: String(query.search), mode: "insensitive" } },
        { last_name: { contains: String(query.search), mode: "insensitive" } },
      ],
    });
  if (query.status) and.push({ graduate_info: { tag: String(query.status) } });
  if (query.group_id) and.push({ groups: { some: { id: Number(query.group_id) } } });
  if (query.course_id) and.push({ groups: { some: { course_id: Number(query.course_id) } } });
  return { AND: and };
}

export const getGraduates = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_dir } = getPagination(req.query);
  const where = graduateWhere(req.query);

  const [data, total] = await Promise.all([
    prisma.student.findMany({ where, skip, take: limit, orderBy: { id: sort_dir }, include: graduateInclude }),
    prisma.student.count({ where }),
  ]);

  res.json(buildEnvelope(data.map(graduateDto), total, page, limit));
};

export const updateGraduate = async (req: Request, res: Response) => {
  const studentId = Number(req.params.id);
  const { work_place, has_certificate, tag } = req.body;

  await prisma.graduateInfo.upsert({
    where: { student_id: studentId },
    update: { work_place, has_certificate, tag },
    create: { student_id: studentId, work_place, has_certificate, tag },
  });

  const student = await prisma.student.findUnique({ where: { id: studentId }, include: graduateInclude });
  res.json(graduateDto(student));
};

export const getGraduatesStats = async (_req: Request, res: Response) => {
  const [graduates, rows] = await Promise.all([
    prisma.student.count({ where: { status: "finished" } }),
    prisma.graduateInfo.groupBy({ by: ["tag"], _count: { _all: true } }),
  ]);
  const by = (tag: string) => rows.find((r) => r.tag === tag)?._count._all ?? 0;

  res.json({
    graduates,
    employed: by("Work"),
    open_to_work: by("OpenToWork"),
    freelancer: by("Freelancer"),
    further_edu: by("FurtherEducation"),
    entrepreneur: by("Entrepreneur"),
  });
};

/** Табақаи «Groups» дар саҳифаи Graduates — як сатр барои ҳар гурӯҳ бо rows-и дарунӣ. */
export const getGraduateGroups = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const where: any = { students: { some: { status: "finished" } } };
  if (req.query.course_id) where.course_id = Number(req.query.course_id);
  if (req.query.search) where.name = { contains: String(req.query.search), mode: "insensitive" };

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where,
      skip,
      take: limit,
      include: {
        course: true,
        students: { where: { status: "finished" }, include: graduateInclude },
      },
    }),
    prisma.group.count({ where }),
  ]);

  const data = groups.map((g) => ({
    id: g.id,
    name: g.name,
    students_count: g.students.length,
    period: fmtPeriod(g.start_date, g.end_date),
    rows: g.students.map((s) => ({ ...graduateDto(s), group: g.name })),
  }));
  res.json(buildEnvelope(data, total, page, limit));
};

export const getGraduateById = async (req: Request, res: Response) => {
  const student = await prisma.student.findFirst({
    where: { id: Number(req.params.id), status: "finished" },
    include: graduateInclude,
  });
  if (!student) return res.status(404).json({ message: "Хатмкунанда ёфт нашуд" });
  res.json(graduateDto(student));
};

// ===== Enroll =====

export const enrollStudent = async (req: Request, res: Response) => {
  const { student_id, group_id, new_student } = req.body;
  let studentId = Number(student_id);

  if (!studentId && new_student) {
    const created = await prisma.student.create({
      data: {
        ...new_student,
        birth_date: new_student.birth_date ? new Date(new_student.birth_date) : new Date("2000-01-01"),
      },
    });
    studentId = created.id;
  }
  if (!studentId) return res.status(400).json({ message: "student_id ҳатмист" });
  if (!group_id) return res.status(400).json({ message: "group_id ҳатмист" });

  await prisma.group.update({
    where: { id: Number(group_id) },
    data: { students: { connect: { id: studentId } } },
  });
  res.json({ success: true, student_id: studentId });
};

/** Рӯйхати донишҷӯёни навбақайдгирифташуда (саҳифаи Enroll students). */
export const getEnrolledList = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_dir } = getPagination(req.query);
  const { search, group_id, month } = req.query;

  const and: any[] = [];
  if (search)
    and.push({
      OR: [
        { first_name: { contains: String(search), mode: "insensitive" } },
        { last_name: { contains: String(search), mode: "insensitive" } },
      ],
    });
  if (group_id) and.push({ groups: { some: { id: Number(group_id) } } });
  if (month) {
    // month = "2023-06" ё рақами моҳ
    const now = new Date();
    const [y, m] = String(month).includes("-")
      ? String(month).split("-").map(Number)
      : [now.getFullYear(), Number(month)];
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    and.push({ created_at: { gte: start, lt: end } });
  }
  const where = and.length ? { AND: and } : {};

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: sort_dir },
      include: { groups: { include: { mentors: true } } },
    }),
    prisma.student.count({ where }),
  ]);

  res.json(
    buildEnvelope(
      data.map((s) => {
        const g = s.groups[0];
        return {
          id: s.id,
          full_name: fullName(s),
          group: g?.name ?? "",
          mentor: g?.mentors?.map(mentorName).join(", ") ?? "",
          phone: s.phone ?? "",
          date: fmtDate(s.created_at),
          reason: "",
        };
      }),
      total,
      page,
      limit
    )
  );
};

// ===== Self-service (role=student) — фақат маълумоти худашро мебинад =====

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { id: req.user!.student_id },
    include: { ...studentInclude, graduate_info: true },
  });
  if (!student) return res.status(404).json({ message: "Профил ёфт нашуд" });
  res.json(studentDto(student));
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

// ===== Leaders — рейтинги донишҷӯён аз рӯи coin =====

export const getLeaders = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, group_id } = req.query;

  const and: any[] = [{ status: "active" }];
  if (search)
    and.push({
      OR: [
        { first_name: { contains: String(search), mode: "insensitive" } },
        { last_name: { contains: String(search), mode: "insensitive" } },
      ],
    });
  if (group_id) and.push({ groups: { some: { id: Number(group_id) } } });
  const where = { AND: and };

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { coin_balance: "desc" },
      include: { groups: true },
    }),
    prisma.student.count({ where }),
  ]);

  res.json(
    buildEnvelope(
      data.map((s, i) => ({
        id: s.id,
        rank: skip + i + 1,
        full_name: fullName(s),
        points: s.coin_balance,
        phone: s.phone ?? "",
        group: s.groups[0]?.name ?? "",
        photo: s.photo ?? null,
      })),
      total,
      page,
      limit
    )
  );
};

export const getLeadersWinners = async (_req: Request, res: Response) => {
  const winners = await prisma.student.findMany({
    where: { status: "active" },
    orderBy: { coin_balance: "desc" },
    take: 3,
    include: { groups: true },
  });

  res.json(
    buildEnvelope(
      winners.map((s) => ({
        id: s.id,
        full_name: fullName(s),
        age: ageFrom(s.birth_date),
        points: s.coin_balance,
        group: s.groups[0]?.name ?? "",
        date: fmtDate(s.created_at),
        photo: s.photo ?? null,
      })),
      winners.length,
      1,
      3
    )
  );
};

// ===== Left courses — саҳифаи пурра (рӯйхат/chart/гурӯҳ) =====

const leftRowDto = (s: any, groupName?: string) => {
  const g = s.groups?.[0];
  return {
    id: s.id,
    full_name: fullName(s),
    group: groupName ?? g?.name ?? "",
    mentor: (g?.mentors ?? []).map(mentorName).join(", "),
    phone: s.phone ?? "",
    date: fmtDate(s.left_at ?? s.created_at),
    reason: s.left_reason ?? "",
  };
};

export const getLeftCoursesList = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_dir } = getPagination(req.query);
  const { search, course_id, group_id } = req.query;

  const and: any[] = [{ status: "inactive" }];
  if (search)
    and.push({
      OR: [
        { first_name: { contains: String(search), mode: "insensitive" } },
        { last_name: { contains: String(search), mode: "insensitive" } },
      ],
    });
  if (group_id) and.push({ groups: { some: { id: Number(group_id) } } });
  if (course_id) and.push({ groups: { some: { course_id: Number(course_id) } } });
  const where = { AND: and };

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { left_at: sort_dir },
      include: { groups: { include: { course: true, mentors: true } } },
    }),
    prisma.student.count({ where }),
  ]);

  res.json(buildEnvelope(data.map((s) => leftRowDto(s)), total, page, limit));
};

export const getLeftCoursesChart = async (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const students = await prisma.student.findMany({
    where: { status: "inactive", left_at: { gte: start, lt: end } },
    select: { left_at: true },
  });

  const counts = new Array(12).fill(0);
  for (const s of students) if (s.left_at) counts[s.left_at.getMonth()]++;

  res.json({ data: MONTHS.map((month, i) => ({ month, value: counts[i] })) });
};

export const getLeftCoursesGroups = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const where: any = { students: { some: { status: "inactive" } } };
  if (req.query.course_id) where.course_id = Number(req.query.course_id);
  if (req.query.search) where.name = { contains: String(req.query.search), mode: "insensitive" };

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where,
      skip,
      take: limit,
      include: { course: true, mentors: true, students: { where: { status: "inactive" } } },
    }),
    prisma.group.count({ where }),
  ]);

  const data = groups.map((g) => ({
    id: g.id,
    name: g.name,
    students_count: g.students.length,
    period: fmtPeriod(g.start_date, g.end_date),
    rows: g.students.map((s) => ({
      ...leftRowDto({ ...s, groups: [g] }, g.name),
      mentor: g.mentors.map(mentorName).join(", "),
    })),
  }));
  res.json(buildEnvelope(data, total, page, limit));
};

// ===== Student activity =====

/** Категория аз tag-и гурӯҳи донишҷӯ гирифта мешавад (Black list, Kettle, Advanced...). */
export const getStudentActivity = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, group_id, category, from, to } = req.query;

  const and: any[] = [{ status: { not: "finished" } }];
  if (search)
    and.push({
      OR: [
        { first_name: { contains: String(search), mode: "insensitive" } },
        { last_name: { contains: String(search), mode: "insensitive" } },
      ],
    });
  if (group_id) and.push({ groups: { some: { id: Number(group_id) } } });
  if (category) and.push({ groups: { some: { tag: String(category) } } });
  const where = { AND: and };

  const absenceWhere: any = { attendance: false };
  if (from || to) {
    absenceWhere.day_date = {};
    if (from) absenceWhere.day_date.gte = new Date(String(from));
    if (to) absenceWhere.day_date.lte = new Date(String(to));
  }

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { coin_balance: "desc" },
      include: {
        groups: true,
        _count: { select: { journal_entries: { where: absenceWhere } } },
      },
    }),
    prisma.student.count({ where }),
  ]);

  res.json(
    buildEnvelope(
      data.map((s) => ({
        id: s.id,
        full_name: fullName(s),
        group: s.groups[0]?.name ?? "",
        points: s.coin_balance,
        category: s.groups[0]?.tag ?? "",
        absence: s._count.journal_entries,
      })),
      total,
      page,
      limit
    )
  );
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

  const counts = new Array(12).fill(0);
  for (const s of students) counts[s.created_at.getMonth()]++;

  res.json({ data: MONTHS.map((month, i) => ({ month, value: counts[i] })) });
};
