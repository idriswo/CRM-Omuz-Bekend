import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import { authorize } from "../../middlewares/rbac.middleware";
import { ROLES } from "../../constants/roles";
import { getPayments, createPayment, updatePayment, deletePayment, exportPayments } from "./payments.controller";

const router = Router();
// Финанс — фақат superadmin ва director (тибқи дархости корбар: admin ба он дастрасӣ надорад)
router.use(authorize(ROLES.SUPERADMIN, ROLES.DIRECTOR));

/**
 * @openapi
 * /payments/export:
 *   get:
 *     tags: [Payments]
 *     summary: Экспорти пардохтҳо ба xlsx
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Файли xlsx } }
 */
router.get("/export", exportPayments);

/**
 * @openapi
 * /payments:
 *   get:
 *     tags: [Payments]
 *     summary: Рӯйхати пардохтҳо (student_id/group_id/branch_id/status)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Payments]
 *     summary: Сабти пардохти нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/", getPayments);
router.post("/", logAction("Payment", "create"), createPayment);

/**
 * @openapi
 * /payments/{id}:
 *   put:
 *     tags: [Payments]
 *     summary: Навсозии пардохт
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Payments]
 *     summary: Нест кардани пардохт
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/:id", logAction("Payment", "update"), updatePayment);
router.delete("/:id", logAction("Payment", "delete"), deletePayment);

export default router;
