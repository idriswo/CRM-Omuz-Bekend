import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";

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
  res.status(201).json(student);
};

export const updateStudent = async (req: Request, res: Response) => {
  const { first_name, last_name, birth_date, gender, address, email, phone, father_phone, status, branch_id } =
    req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : undefined;

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
