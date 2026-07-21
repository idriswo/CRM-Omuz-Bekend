import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../utils/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { smsProvider } from "../../utils/smsProvider";

const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 дақиқа

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

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.user.update({
    where: { id: user.id },
    data: { reset_code: code, reset_code_expires: new Date(Date.now() + RESET_CODE_TTL_MS) },
  });
  await smsProvider.send(phone, `Коди барқарорсозии парол: ${code}`);

  res.json({ message: "Код фиристода шуд" });
};

// POST /auth/verify-reset-code — тафтиши кодест, ки бо SMS фиристода шуд
export const verifyResetCode = async (req: Request, res: Response) => {
  const { phone, code } = req.body;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.reset_code || user.reset_code !== code) {
    return res.status(400).json({ message: "Коди хато" });
  }
  if (!user.reset_code_expires || user.reset_code_expires < new Date()) {
    return res.status(400).json({ message: "Мӯҳлати код гузаштааст" });
  }
  res.json({ success: true, valid: true });
};

// POST /auth/reset-password — таъини паролии нав тавассути коди тасдиқшуда (бе токен)
export const resetPassword = async (req: Request, res: Response) => {
  const { phone, code, new_password } = req.body;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.reset_code || user.reset_code !== code) {
    return res.status(400).json({ message: "Коди хато" });
  }
  if (!user.reset_code_expires || user.reset_code_expires < new Date()) {
    return res.status(400).json({ message: "Мӯҳлати код гузаштааст" });
  }

  const hashed = await bcrypt.hash(new_password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, reset_code: null, reset_code_expires: null, refresh_token: null },
  });
  res.json({ success: true, message: "Парол иваз шуд. Бо парoли нав ворид шавед." });
};

export const logout = async (req: Request, res: Response) => {
  const { user_id } = req.body;
  await prisma.user.update({ where: { id: user_id }, data: { refresh_token: null } });
  res.json({ success: true });
};

// POST /auth/change-password — ҳар корбари ворид шуда паролии худро иваз мекунад
export const changePassword = async (req: AuthRequest, res: Response) => {
  const { old_password, new_password } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || !(await bcrypt.compare(old_password, user.password))) {
    return res.status(401).json({ message: "Паролии кӯҳна хато аст" });
  }
  const hashed = await bcrypt.hash(new_password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed, refresh_token: null } });
  res.json({ success: true, message: "Парол иваз шуд. Бо парoли нав дубора ворид шавед." });
};

// GET /auth/me — профили худи корбари ворид шуда, новобаста аз нақш
export const getMe = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { role: true },
  });
  if (!user) return res.status(404).json({ message: "Корбар ёфт нашуд" });
  const { password: _pw, refresh_token: _rt, reset_code: _rc, reset_code_expires: _rce, ...safeUser } = user;
  res.json(safeUser);
};
