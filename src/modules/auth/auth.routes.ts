import { Router } from "express";
import { register, login, refreshToken, forgotPassword, logout } from "./auth.controller";

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
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Баровардан аз система (нест кардани refresh_token)
 *     responses:
 *       200: { description: OK }
 */
router.post("/logout", logout);

export default router;
