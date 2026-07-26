import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rateLimit } from "../../middlewares/rateLimit.middleware";
import {
  login,
  refreshToken,
  forgotPassword,
  logout,
  changePassword,
  verifyResetCode,
  resetPassword,
  getMe,
} from "./auth.controller";

const router = Router();

// Route-ҳои кушода (бе токен) бояд маҳдуд бошанд, вагарна паролро ё
// коди 6-рақамаи email-ро бо роҳи санҷиши пайдарпай ёфтан мумкин аст.
const byEmail = (req: any) =>
  typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : undefined;

const loginLimit = rateLimit({
  max: 10,
  window_ms: 15 * 60 * 1000,
  key_by: byEmail,
  message: "Кӯшишҳои воридшавӣ аз ҳад зиёданд. Пас аз 15 дақиқа кӯшиш кунед.",
});
// Талаб: як суроға дар як соат зиёда аз 5 дархости forgot-password фиристода натавонад
const forgotLimit = rateLimit({ max: 5, window_ms: 60 * 60 * 1000, key_by: byEmail });
// Ғайр аз ҳисоби кӯшишҳо дар худи код (5 хато → бекор), маҳдудияти дархост низ лозим
const codeLimit = rateLimit({ max: 10, window_ms: 15 * 60 * 1000, key_by: byEmail });

// Эзоҳ: POST /auth/register нест карда шуд — сабти кушода имкони сохтани
// ҳисобҳои беохир ва тафтиши рақамҳои телефонро медод. Ҳисоб танҳо тавассути
// POST /users (director/superadmin) ё POST /students/:id/invite сохта мешавад.

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Воридшавӣ бо email/password, бармегардонад access_token ва refresh_token
 *     responses:
 *       200: { description: OK }
 *       401: { description: Email ё парол хато }
 *       429: { description: Кӯшишҳо аз ҳад зиёданд }
 */
router.post("/login", loginLimit, login);

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Гирифтани access_token-и нав тавассути refresh_token
 *     responses:
 *       200: { description: OK }
 */
router.post("/refresh-token", refreshToken);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Фиристодани коди 6-рақамаи барқарорсозӣ ба email
 *     description: Ҷавоб ҳамеша якхела аст — новобаста аз он ки суроға сабт шудааст ё не
 *     responses:
 *       200: { description: Агар суроға вуҷуд дошта бошад, код фиристода шуд }
 *       429: { description: Дархостҳо аз ҳад зиёданд }
 */
router.post("/forgot-password", forgotLimit, forgotPassword);

/**
 * @openapi
 * /auth/verify-reset-code:
 *   post:
 *     tags: [Auth]
 *     summary: Тафтиши коди барқарорсозӣ; reset_token бармегардонад
 *     description: Пас аз 5 кӯшиши нодуруст код тамоман бекор карда мешавад
 *     responses:
 *       200: { description: Код дуруст — reset_token бармегардад }
 *       400: { description: Код хато ё мӯҳлаташ гузаштааст }
 *       429: { description: Кӯшишҳо аз ҳад зиёданд }
 */
router.post("/verify-reset-code", codeLimit, verifyResetCode);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Таъини паролии нав тавассути reset_token (як бор истифодашаванда)
 *     responses:
 *       200: { description: Парол иваз шуд }
 *       400: { description: Токен нодуруст, мӯҳлаташ гузашта, ё парол кӯтоҳ аст }
 *       429: { description: Кӯшишҳо аз ҳад зиёданд }
 */
router.post("/reset-password", codeLimit, resetPassword);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Баровардан аз система (нест кардани refresh_token-и худи корбар)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Токен нест ё нодуруст аст }
 */
router.post("/logout", authMiddleware, logout);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Иваз кардани паролии худи корбари ворид шуда (лозим аст токен)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Парол иваз шуд }
 *       401: { description: Паролии кӯҳна хато аст }
 */
router.post("/change-password", authMiddleware, changePassword);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Профили худи корбари ворид шуда (новобаста аз нақш — student/admin/superadmin/director)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get("/me", authMiddleware, getMe);

export default router;
