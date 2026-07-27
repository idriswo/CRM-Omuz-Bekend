import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../utils/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { sendEmail, resetCodeEmail } from "../../utils/mailer";
import { normalizeEmail } from "../../utils/email";

const RESET_CODE_TTL_MINUTES = 10;
const RESET_CODE_TTL_MS = RESET_CODE_TTL_MINUTES * 60 * 1000;
// Токени муваққатӣ кӯтоҳмуддат аст — он танҳо барои қадами навбатӣ лозим
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
// Пас аз ин қадар кӯшиши нодуруст код тамоман бекор карда мешавад
const MAX_CODE_ATTEMPTS = 5;

// Ҷавоби ягона барои ҳамаи ҳолатҳои forgot-password — то маълум нашавад,
// ки кадом суроға дар система ҳаст ва кадом не.
const FORGOT_PASSWORD_REPLY = { message: "Агар ин суроға дар система бошад, код фиристода шуд" };
const INVALID_CODE_REPLY = { message: "Код хато ё мӯҳлаташ гузаштааст" };
const INVALID_TOKEN_REPLY = { message: "Токен нодуруст аст ё мӯҳлаташ гузаштааст" };

const ACCESS_TOKEN_TTL = (process.env.ACCESS_TOKEN_TTL || "3h") as jwt.SignOptions["expiresIn"];
const REFRESH_TOKEN_TTL = (process.env.REFRESH_TOKEN_TTL || "7d") as jwt.SignOptions["expiresIn"];

async function buildAccessToken(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  return jwt.sign(
    {
      id: user!.id,
      role: user!.role?.name,
      student_id: user!.student_id,
      // барои mentor: ҷадвали дарсҳо аз рӯи ҳамин филтр мешавад
      employee_id: user!.employee_id,
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
  const { email, password } = req.body ?? {};

  // Дар база email ҳамеша хурдҳарф ва бе фосила аст — вуруд низ ҳамон
  // нормализатсия мегузарад, то "Salim@Gmail.com" ҳамон ҳисобро ёбад
  const emailValue = normalizeEmail(email);
  const user = emailValue
    ? await prisma.user.findUnique({ where: { email: emailValue }, include: { role: true } })
    : null;

  if (!user || typeof password !== "string" || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "Email ё парол хато" });

  const access_token = jwt.sign(
    {
      id: user.id,
      role: user.role?.name,
      student_id: user.student_id,
      employee_id: user.employee_id,
      must_change_password: user.must_change_password,
    },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
  const refresh_token = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_TTL,
  });

  await prisma.user.update({ where: { id: user.id }, data: { refresh_token } });

  const {
    password: _pw,
    refresh_token: _rt,
    reset_code: _rc,
    reset_code_expires: _rce,
    reset_code_attempts: _rca,
    reset_token: _rtk,
    reset_token_expires: _rtke,
    ...safeUser
  } = user;
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

/** Ҳамаи майдонҳои барқарорсозӣ якбора тоза мешаванд. */
const CLEAR_RESET_FIELDS = {
  reset_code: null,
  reset_code_expires: null,
  reset_code_attempts: 0,
  reset_token: null,
  reset_token_expires: null,
} as const;

/**
 * ҚАДАМИ 1 — POST /auth/forgot-password
 * Коди 6-рақама месозад, дар база ҳамчун hash нигоҳ медорад ва бо email мефиристад.
 */
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  const emailValue = normalizeEmail(email);
  if (!emailValue) return res.json(FORGOT_PASSWORD_REPLY);

  const user = await prisma.user.findUnique({ where: { email: emailValue } });
  // Ҷавоб дар ҳар ҳол якхела аст — вагарна аз рӯи 404 фаҳмидан мумкин буд,
  // ки кадом суроғаҳо дар система сабтанд.
  if (!user) return res.json(FORGOT_PASSWORD_REPLY);

  // crypto.randomInt, на Math.random — коди пешбинишаванда набояд бошад
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...CLEAR_RESET_FIELDS, // токени кӯҳна ва ҳисоби кӯшишҳо бекор мешаванд
      reset_code: await bcrypt.hash(code, 10),
      reset_code_expires: new Date(Date.now() + RESET_CODE_TTL_MS),
    },
  });

  // Хатои почта набояд ба клиент маълумот диҳад, ки суроға вуҷуд дорад —
  // бинобар ин танҳо лог мешавад ва ҷавоб ҳамон мемонад.
  try {
    await sendEmail(
      resetCodeEmail({
        full_name: user.full_name,
        email: emailValue,
        code,
        ttl_minutes: RESET_CODE_TTL_MINUTES,
      })
    );
  } catch (err) {
    console.error(`[auth] коди барқарорсозӣ ба ${emailValue} нарасид:`, err instanceof Error ? err.message : err);
  }

  res.json(FORGOT_PASSWORD_REPLY);
};

/**
 * ҚАДАМИ 2 — POST /auth/verify-reset-code
 * Кодро месанҷад ва барои қадами навбатӣ токени муваққатӣ медиҳад.
 * Пас аз MAX_CODE_ATTEMPTS кӯшиши нодуруст код тамоман бекор мешавад.
 */
export const verifyResetCode = async (req: Request, res: Response) => {
  const { email, code } = req.body ?? {};
  const emailValue = normalizeEmail(email);
  if (!emailValue || typeof code !== "string") return res.status(400).json(INVALID_CODE_REPLY);

  const user = await prisma.user.findUnique({ where: { email: emailValue } });
  if (!user?.reset_code || !user.reset_code_expires || user.reset_code_expires < new Date()) {
    return res.status(400).json(INVALID_CODE_REPLY);
  }

  if (!(await bcrypt.compare(code, user.reset_code))) {
    const attempts = user.reset_code_attempts + 1;
    if (attempts >= MAX_CODE_ATTEMPTS) {
      // Код сӯхт — корбар бояд аз нав forgot-password кунад
      await prisma.user.update({ where: { id: user.id }, data: CLEAR_RESET_FIELDS });
      return res.status(400).json({
        message: `Код ${MAX_CODE_ATTEMPTS} маротиба хато ворид шуд ва бекор карда шуд. Аз нав дархост кунед.`,
      });
    }
    await prisma.user.update({ where: { id: user.id }, data: { reset_code_attempts: attempts } });
    return res.status(400).json({
      ...INVALID_CODE_REPLY,
      attempts_left: MAX_CODE_ATTEMPTS - attempts,
    });
  }

  // Токен ҳамчун hash нигоҳ дошта мешавад — мисли худи парол.
  // Код фавран бекор мешавад: як код → як токен.
  const resetToken = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      reset_code: null,
      reset_code_expires: null,
      reset_code_attempts: 0,
      reset_token: await bcrypt.hash(resetToken, 10),
      reset_token_expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  res.json({
    success: true,
    valid: true,
    reset_token: resetToken,
    expires_in_minutes: RESET_TOKEN_TTL_MS / 60_000,
  });
};

/**
 * ҚАДАМИ 3 — POST /auth/reset-password
 * Танҳо reset_token ва пароли навро мегирад — email ва код дигар лозим нест.
 * Токен танҳо як бор кор мекунад.
 */
export const resetPassword = async (req: Request, res: Response) => {
  const { reset_token, new_password } = req.body ?? {};
  if (typeof new_password !== "string" || new_password.length < 8) {
    return res.status(400).json({ message: "Парол бояд на камтар аз 8 аломат бошад" });
  }
  if (typeof reset_token !== "string" || !reset_token) {
    return res.status(400).json(INVALID_TOKEN_REPLY);
  }

  // Токен hash аст, пас аз рӯи он ҷустуҷӯ кардан мумкин нест —
  // ҳамаи ҳисобҳои токени эътибордор дошта санҷида мешаванд. Дар як лаҳза
  // онҳо якчандто беш нестанд, чун токен 15 дақиқа эътибор дорад.
  const candidates = await prisma.user.findMany({
    where: { reset_token: { not: null }, reset_token_expires: { gt: new Date() } },
  });

  let user = null;
  for (const candidate of candidates) {
    if (await bcrypt.compare(reset_token, candidate.reset_token!)) {
      user = candidate;
      break;
    }
  }
  if (!user) return res.status(400).json(INVALID_TOKEN_REPLY);

  const hashed = await bcrypt.hash(new_password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      ...CLEAR_RESET_FIELDS, // токен як бор истифода шуд ва бекор мешавад
      // refresh_token низ тоза мешавад — то session-и кӯҳна (эҳтимолан аз они дузд) бекор шавад.
      refresh_token: null,
      // корбар акнун паролро худаш интихоб кардааст
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
  const {
    password: _pw,
    refresh_token: _rt,
    reset_code: _rc,
    reset_code_expires: _rce,
    reset_code_attempts: _rca,
    reset_token: _rtk,
    reset_token_expires: _rtke,
    ...safeUser
  } = user;
  res.json(safeUser);
};
