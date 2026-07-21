import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope } from "../../utils/pagination";

const safeUser = (u: any) => {
  const { password, refresh_token, ...rest } = u;
  return rest;
};

export const getUsers = async (req: Request, res: Response) => {
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

export const createUser = async (req: Request, res: Response) => {
  const { phone, password, full_name, role_id, branch_id } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { phone, password: hashed, full_name, role_id: role_id ? Number(role_id) : undefined, branch_id: branch_id ? Number(branch_id) : undefined },
  });
  res.status(201).json(safeUser(user));
};

export const updateUser = async (req: Request, res: Response) => {
  const { phone, full_name, role_id, branch_id } = req.body;
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

export const deleteUser = async (req: Request, res: Response) => {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};
