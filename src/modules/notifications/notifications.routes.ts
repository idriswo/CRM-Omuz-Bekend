import { Router } from "express";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "./notifications.controller";

const router = Router();

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Огоҳиномаҳои корбари ворид шуда
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/", getNotifications);

/**
 * @openapi
 * /notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Ҳамаро хондашуда қайд кардан
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.put("/read-all", markAllNotificationsRead);

/**
 * @openapi
 * /notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Як огоҳиномаро хондашуда қайд кардан
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/:id/read", markNotificationRead);

export default router;
