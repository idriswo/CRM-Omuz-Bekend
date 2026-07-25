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
// коди 6-рақамаи SMS-ро бо роҳи санҷиши пайдарпай ёфтан мумкин аст.
const byPhone = (req: any) => (typeof req.body?.phone === "string" ? req.body.phone : undefined);

const loginLimit = rateLimit({
  max: 10,
  window_ms: 15 * 60 * 1000,
  key_by: byPhone,
  message: "Кӯшишҳои воридшавӣ аз ҳад зиёданд. Пас аз 15 дақиқа кӯшиш кунед.",
});
const forgotLimit = rateLimit({ max: 5, window_ms: 60 * 60 * 1000, key_by: byPhone });
// Коди барқарорсозӣ 6 рақам аст — бе ин маҳдудият дар 15 дақиқа онро ёфтан мумкин буд
const codeLimit = rateLimit({ max: 10, window_ms: 15 * 60 * 1000, key_by: byPhone });

// Эзоҳ: POST /auth/register нест карда шуд — сабти кушода имкони сохтани
// ҳисобҳои беохир ва тафтиши рақамҳои телефонро медод. Ҳисоб танҳо тавассути
// POST /users (director/superadmin) ё POST /students/:id/invite сохта мешавад.

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Воридшавӣ бо phone/password, бармегардонад access_token ва refresh_token
 *     responses:
 *       200: { description: OK }
 *       401: { description: Телефон ё парол хато }
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
 *     summary: Фиристодани коди барқарорсозии парол ба телефон
 *     description: Ҷавоб ҳамеша якхела аст — новобаста аз он ки рақам сабт шудааст ё не
 *     responses:
 *       200: { description: Агар рақам вуҷуд дошта бошад, код фиристода шуд }
 *       429: { description: Дархостҳо аз ҳад зиёданд }
 */
router.post("/forgot-password", forgotLimit, forgotPassword);

/**
 * @openapi
 * /auth/verify-reset-code:
 *   post:
 *     tags: [Auth]
 *     summary: Тафтиши коди барқарорсозӣ (пеш аз reset-password)
 *     responses:
 *       200: { description: Код дуруст аст }
 *       400: { description: Код хато ё мӯҳлаташ гузаштааст }
 *       429: { description: Кӯшишҳо аз ҳад зиёданд }
 */
router.post("/verify-reset-code", codeLimit, verifyResetCode);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Таъини паролии нав тавассути коди тасдиқшуда (бе токен)
 *     responses:
 *       200: { description: Парол иваз шуд }
 *       400: { description: Код хато, мӯҳлаташ гузашта, ё парол кӯтоҳ аст }
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
