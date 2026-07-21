import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  register,
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

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Сабти корбари нав
 *     responses:
 *       201: { description: Корбар сохта шуд }
 */
router.post("/register", register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Воридшавӣ бо phone/password, бармегардонад access_token ва refresh_token
 *     responses:
 *       200: { description: OK }
 *       401: { description: Телефон ё парол хато }
 */
router.post("/login", login);

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
 *     responses:
 *       200: { description: Код фиристода шуд }
 */
router.post("/forgot-password", forgotPassword);

/**
 * @openapi
 * /auth/verify-reset-code:
 *   post:
 *     tags: [Auth]
 *     summary: Тафтиши коди барқарорсозӣ (пеш аз reset-password)
 *     responses:
 *       200: { description: Код дуруст аст }
 *       400: { description: Код хато ё мӯҳлаташ гузаштааст }
 */
router.post("/verify-reset-code", verifyResetCode);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Таъини паролии нав тавассути коди тасдиқшуда (бе токен)
 *     responses:
 *       200: { description: Парол иваз шуд }
 *       400: { description: Код хато ё мӯҳлаташ гузаштааст }
 */
router.post("/reset-password", resetPassword);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Баровардан аз система (нест кардани refresh_token)
 *     responses:
 *       200: { description: OK }
 */
router.post("/logout", logout);

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
