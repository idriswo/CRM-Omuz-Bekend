import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../utils/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { smsProvider } from "../../utils/smsProvider";
import { normalizePhone } from "../../utils/phone";

const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 дақиқа

// Ҷавоби ягона барои ҳамаи ҳолатҳои forgot-password — то маълум нашавад,
// ки кадом рақами телефон дар система ҳаст ва кадом не.
const FORGOT_PASSWORD_REPLY = { message: "Агар ин рақам дар система бошад, код фиристода шуд" };
const INVALID_CODE_REPLY = { message: "Код хато ё мӯҳлаташ гузаштааст" };

const ACCESS_TOKEN_TTL = (process.env.ACCESS_TOKEN_TTL || "3h") as jwt.SignOptions["expiresIn"];
const REFRESH_TOKEN_TTL = (process.env.REFRESH_TOKEN_TTL || "7d") as jwt.SignOptions["expiresIn"];

async function buildAccessToken(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  return jwt.sign(
    {
      id: user!.id,
      role: user!.role?.name,
      student_id: user!.student_id,
      must_change_password: user!.must_change_password,
    },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

// Эзоҳ: POST /auth/register қасдан вуҷуд надорад. Сабти кушода имкон медод, ки
// ҳар кас ҳисоб созад ва рақамҳои телефони мавҷударо тафтиш кунад. Ҳисобҳо танҳо
// аз ду ҷо сохта мешаванд: POST /users (director/superadmin) ва
// POST /students/:id/invite (барои донишҷӯ).

export const login = async (req: Request, res: Response) => {
  const { phone, password } = req.body ?? {};

  // Дар база phone ҳамеша дар шакли 992XXXXXXXXX аст, бинобар ин вуруд низ
  // нормализа мешавад — корбар метавонад "902223344" ё "+992 90 222 33 44" нависад
  const phoneValue = normalizePhone(phone);
  const user = phoneValue
    ? await prisma.user.findUnique({ where: { phone: phoneValue }, include: { role: true } })
    : null;

  if (!user || typeof password !== "string" || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "Телефон ё парол хато" });

  const access_token = jwt.sign(
    {
      id: user.id,
      role: user.role?.name,
      student_id: user.student_id,
      must_change_password: user.must_change_password,
    },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
  const refresh_token = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_TTL,
  });

  await prisma.user.update({ where: { id: user.id }, data: { refresh_token } });

  const { password: _pw, refresh_token: _rt, ...safeUser } = user;
  // must_change_password дар решаи ҷавоб низ — то фронтенд фавран ба
  // экрани ивази парол равад, на пас аз гирифтани 403
  res.json({ access_token, refresh_token, must_change_password: user.must_change_password, user: safeUser });
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

/**
 * Коди барқарорсозиро месанҷад ва корбарро бармегардонад (ё null).
 * Код дар база ҳамчун hash нигоҳ дошта мешавад — бинобар ин ҳатто дастрасӣ
 * ба база имкони гирифтани коди фаъолро намедиҳад.
 */
async function findUserByResetCode(phone: unknown, code: unknown) {
  if (typeof code !== "string") return null;
  const phoneValue = normalizePhone(phone);
  if (!phoneValue) return null;

  const user = await prisma.user.findUnique({ where: { phone: phoneValue } });
  if (!user?.reset_code || !user.reset_code_expires) return null;
  if (user.reset_code_expires < new Date()) return null;
  if (!(await bcrypt.compare(code, user.reset_code))) return null;

  return user;
}

export const forgotPassword = async (req: Request, res: Response) => {
  const { phone } = req.body ?? {};
  const phoneValue = normalizePhone(phone);
  if (!phoneValue) return res.json(FORGOT_PASSWORD_REPLY);

  const user = await prisma.user.findUnique({ where: { phone: phoneValue } });
  // Ҷавоб дар ҳар ҳол якхела аст — вагарна аз рӯи 404 фаҳмидан мумкин буд,
  // ки кадом рақамҳо дар система сабтанд.
  if (!user) return res.json(FORGOT_PASSWORD_REPLY);

  // crypto.randomInt, на Math.random — коди пешбинишаванда набояд бошад.
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      reset_code: await bcrypt.hash(code, 10),
      reset_code_expires: new Date(Date.now() + RESET_CODE_TTL_MS),
    },
  });
  await smsProvider.send(phoneValue, `Коди барқарорсозии парол: ${code}`);

  res.json(FORGOT_PASSWORD_REPLY);
};

// POST /auth/verify-reset-code — тафтиши кодест, ки бо SMS фиристода шуд
export const verifyResetCode = async (req: Request, res: Response) => {
  const { phone, code } = req.body ?? {};
  const user = await findUserByResetCode(phone, code);
  if (!user) return res.status(400).json(INVALID_CODE_REPLY);

  res.json({ success: true, valid: true });
};

// POST /auth/reset-password — таъини паролии нав тавассути коди тасдиқшуда (бе токен)
export const resetPassword = async (req: Request, res: Response) => {
  const { phone, code, new_password } = req.body ?? {};
  if (typeof new_password !== "string" || new_password.length < 8) {
    return res.status(400).json({ message: "Парол бояд на камтар аз 8 аломат бошад" });
  }

  const user = await findUserByResetCode(phone, code);
  if (!user) return res.status(400).json(INVALID_CODE_REPLY);

  const hashed = await bcrypt.hash(new_password, 10);
  await prisma.user.update({
    where: { id: user.id },
    // refresh_token низ тоза мешавад — то session-и кӯҳна (эҳтимолан аз они дузд) бекор шавад.
    // must_change_password низ: корбар акнун паролро худаш интихоб кардааст.
    data: {
      password: hashed,
      reset_code: null,
      reset_code_expires: null,
      refresh_token: null,
      must_change_password: false,
    },
  });
  res.json({ success: true, message: "Парол иваз шуд. Бо парoли нав ворид шавед." });
};

// Корбар танҳо худашро мебарорад — id аз токен гирифта мешавад, на аз body.
export const logout = async (req: AuthRequest, res: Response) => {
  await prisma.user.update({ where: { id: req.user!.id }, data: { refresh_token: null } });
  res.json({ success: true });
};

// POST /auth/change-password — ҳар корбари ворид шуда паролии худро иваз мекунад
export const changePassword = async (req: AuthRequest, res: Response) => {
  const { old_password, new_password } = req.body ?? {};
  if (typeof new_password !== "string" || new_password.length < 8) {
    return res.status(400).json({ message: "Парол бояд на камтар аз 8 аломат бошад" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || typeof old_password !== "string" || !(await bcrypt.compare(old_password, user.password))) {
    return res.status(401).json({ message: "Паролии кӯҳна хато аст" });
  }
  if (await bcrypt.compare(new_password, user.password)) {
    return res.status(400).json({ message: "Паролии нав бояд аз кӯҳна фарқ кунад" });
  }

  const hashed = await bcrypt.hash(new_password, 10);
  await prisma.user.update({
    where: { id: user.id },
    // must_change_password тоза мешавад — ҳисоб акнун пурра кушода аст
    data: { password: hashed, refresh_token: null, must_change_password: false },
  });
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
