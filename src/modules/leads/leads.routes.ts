import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import { authorize } from "../../middlewares/rbac.middleware";
import { ROLES } from "../../constants/roles";
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToClient,
  transferLeads,
  exportLeads,
  getCoupons,
  createCoupon,
} from "./leads.controller";

const router = Router();
router.use(authorize(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DIRECTOR));

/**
 * @openapi
 * /leads/export:
 *   get:
 *     tags: [Leads]
 *     summary: Экспорти лидҳо ба xlsx
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Файли xlsx } }
 */
router.get("/export", exportLeads);

/**
 * @openapi
 * /leads/coupons:
 *   get:
 *     tags: [Leads]
 *     summary: Рӯйхати купонҳо
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Leads]
 *     summary: Сохтани купон
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/coupons", getCoupons);
router.post("/coupons", logAction("Coupon", "create"), createCoupon);

/**
 * @openapi
 * /leads/transfer:
 *   post:
 *     tags: [Leads]
 *     summary: Кӯчонидани якчанд лид ба курси дигар
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.post("/transfer", logAction("Lead", "transfer"), transferLeads);

/**
 * @openapi
 * /leads/{id}/convert-to-client:
 *   post:
 *     tags: [Leads]
 *     summary: Иваз кардани лид ба Client
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.post("/:id/convert-to-client", logAction("Lead", "convert-to-client"), convertLeadToClient);

/**
 * @openapi
 * /leads:
 *   get:
 *     tags: [Leads]
 *     summary: Рӯйхати лидҳо (pagination/search/course_id/type/utm_source)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Leads]
 *     summary: Сохтани лиди нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/", getLeads);
router.post("/", logAction("Lead", "create"), createLead);

/**
 * @openapi
 * /leads/{id}:
 *   get:
 *     tags: [Leads]
 *     summary: Гирифтани як лид
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   put:
 *     tags: [Leads]
 *     summary: Навсозии лид
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Leads]
 *     summary: Нест кардани лид
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/:id", getLeadById);
router.put("/:id", logAction("Lead", "update"), updateLead);
router.delete("/:id", logAction("Lead", "delete"), deleteLead);

export default router;
