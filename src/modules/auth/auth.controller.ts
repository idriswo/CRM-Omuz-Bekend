import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../utils/prisma";

const ACCESS_TOKEN_TTL = (process.env.ACCESS_TOKEN_TTL || "3h") as jwt.SignOptions["expiresIn"];
const REFRESH_TOKEN_TTL = (process.env.REFRESH_TOKEN_TTL || "7d") as jwt.SignOptions["expiresIn"];

async function buildAccessToken(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  return jwt.sign(
    { id: user!.id, role: user!.role?.name, student_id: user!.student_id },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

export const register = async (req: Request, res: Response) => {
  const { phone, password, full_name } = req.body;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return res.status(409).json({ message: "Ин рақами телефон аллакай сабт шудааст" });

  // Эзоҳ: role_id аз ин ҷо қасдан қабул карда намешавад — то ҳар кас худро superadmin/director
  // эълон карда натавонад. Таъини нақш танҳо тавассути /users (director/superadmin) сурат мегирад.
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { phone, password: hashed, full_name },
  });

  const { password: _pw, ...safeUser } = user;
  res.status(201).json(safeUser);
};

export const login = async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  const user = await prisma.user.findUnique({ where: { phone }, include: { role: true } });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "Телефон ё парол хато" });

  const access_token = jwt.sign(
    { id: user.id, role: user.role?.name, student_id: user.student_id },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
  const refresh_token = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_TTL,
  });

  await prisma.user.update({ where: { id: user.id }, data: { refresh_token } });

  const { password: _pw, refresh_token: _rt, ...safeUser } = user;
  res.json({ access_token, refresh_token, user: safeUser });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(401).json({ message: "No refresh token" });

  try {
    const payload = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET!) as { id: number };
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.refresh_token !== refresh_token)
      return res.status(401).json({ message: "Invalid refresh token" });

    const access_token = await buildAccessToken(user.id);
    res.json({ access_token });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { phone } = req.body;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return res.status(404).json({ message: "Корбар ёфт нашуд" });

  // TODO: пас аз сохтани модули SMS (Phase 10), кодро тавассути smsProvider фиристед
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  res.json({ message: "Код фиристода шуд", code });
};

export const logout = async (req: Request, res: Response) => {
  const { user_id } = req.body;
  await prisma.user.update({ where: { id: user_id }, data: { refresh_token: null } });
  res.json({ success: true });
};
