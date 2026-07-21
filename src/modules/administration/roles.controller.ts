import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const getRoles = async (_req: Request, res: Response) => {
  const roles = await prisma.role.findMany({ include: { permissions: true } });
  res.json(roles);
};

export const createRole = async (req: Request, res: Response) => {
  const { name } = req.body;
  const role = await prisma.role.create({ data: { name } });
  res.status(201).json(role);
};

export const updateRole = async (req: Request, res: Response) => {
  const { name } = req.body;
  const role = await prisma.role.update({ where: { id: Number(req.params.id) }, data: { name } });
  res.json(role);
};

export const deleteRole = async (req: Request, res: Response) => {
  await prisma.role.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
};
