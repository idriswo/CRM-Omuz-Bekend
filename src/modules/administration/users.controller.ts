import { Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { ROLE_CREATE_MATRIX, RoleName } from "../../constants/roles";

const safeUser = (u: any) => {
  const { password, refresh_token, ...rest } = u;
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
      orderBy: { [sort_by as string]: sort_dir },
      include: { role: true },
    }),
    prisma.user.count({ where }),
  ]);

  res.json(buildEnvelope(data.map(safeUser), total, page, limit));
};

export const createUser = async (req: AuthRequest, res: Response) => {
  const { phone, password, full_name, role_id, branch_id } = req.body;

  const targetRole = await prisma.role.findUnique({ where: { id: Number(role_id) } });
  const requesterRole = req.user!.role as RoleName;
  const allowed = ROLE_CREATE_MATRIX[requesterRole] || [];
  if (!targetRole || !allowed.includes(targetRole.name as RoleName)) {
    return res.status(403).json({ message: `Шумо ҳуқуқ надоред нақши "${targetRole?.name}"-ро созед` });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { phone, password: hashed, full_name, role_id: Number(role_id), branch_id: branch_id ? Number(branch_id) : undefined },
  });
  res.status(201).json(safeUser(user));
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  const { phone, full_name, role_id, branch_id } = req.body;

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
      phone,
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

// PUT /users/:id/toggle-add-students — фақат superadmin/director метавонанд имкони "илова кардани донишҷӯ"-и як admin-ро фаъол/хомӯш кунанд
export const toggleCanAddStudents = async (req: AuthRequest, res: Response) => {
  const target = await prisma.user.findUnique({ where: { id: Number(req.params.id) }, include: { role: true } });
  if (!target) return res.status(404).json({ message: "Корбар ёфт нашуд" });
  if (target.role?.name !== "admin") {
    return res.status(400).json({ message: "Ин танзим танҳо барои корбарони admin маъно дорад" });
  }

  const user = await prisma.user.update({
    where: { id: target.id },
    data: { can_add_students: !target.can_add_students },
  });
  res.json({ id: user.id, can_add_students: user.can_add_students });
};
