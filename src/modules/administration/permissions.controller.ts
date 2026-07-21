import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const getPermissions = async (req: Request, res: Response) => {
  const { group, role_id } = req.query;
  const where: any = {};
  if (group) where.group = group;
  if (role_id) where.role_id = Number(role_id);

  const permissions = await prisma.permission.findMany({ where });
  res.json(permissions);
};

export const createPermission = async (req: Request, res: Response) => {
  const { name, group, role_id, enabled } = req.body;
  const permission = await prisma.permission.create({
    data: { name, group, role_id: role_id ? Number(role_id) : undefined, enabled },
  });
  res.status(201).json(permission);
};

export const updatePermission = async (req: Request, res: Response) => {
  const { name, group, role_id, enabled } = req.body;
  const permission = await prisma.permission.update({
    where: { id: Number(req.params.id) },
    data: { name, group, role_id: role_id ? Number(role_id) : undefined, enabled },
  });
  res.json(permission);
};

export const deletePermission = async (req: Request, res: Response) => {
  await prisma.permission.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};
