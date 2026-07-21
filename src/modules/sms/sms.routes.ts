import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import { authorize } from "../../middlewares/rbac.middleware";
import { ROLES } from "../../constants/roles";
import {
  getSmsTemplates,
  createSmsTemplate,
  updateSmsTemplate,
  deleteSmsTemplate,
  sendSms,
  getSmsHistory,
  getRecipientsByGroup,
  getRecipientsStudents,
  getRecipientsMentors,
  getRecipientsLeads,
  getRecipientsGraduates,
} from "./sms.controller";

const router = Router();
router.use(authorize(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DIRECTOR));

/**
 * @openapi
 * /sms/recipients/group:
 *   get:
 *     tags: [SMS]
 *     summary: Рӯйхати донишҷӯёни як гурӯҳ (барои интихоби ретсипиент)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: group_id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/recipients/group", getRecipientsByGroup);
/**
 * @openapi
 * /sms/recipients/students:
 *   get:
 *     tags: [SMS]
 *     summary: Рӯйхати ҳамаи донишҷӯён (id, ном, телефон)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/recipients/students", getRecipientsStudents);
/**
 * @openapi
 * /sms/recipients/mentors:
 *   get:
 *     tags: [SMS]
 *     summary: Рӯйхати ҳамаи кормандон/менторҳо
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/recipients/mentors", getRecipientsMentors);
/**
 * @openapi
 * /sms/recipients/leads:
 *   get:
 *     tags: [SMS]
 *     summary: Рӯйхати ҳамаи лидҳо
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/recipients/leads", getRecipientsLeads);
/**
 * @openapi
 * /sms/recipients/graduates:
 *   get:
 *     tags: [SMS]
 *     summary: Рӯйхати ҳамаи хатмкунандагон
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/recipients/graduates", getRecipientsGraduates);

/**
 * @openapi
 * /sms/templates:
 *   get:
 *     tags: [SMS]
 *     summary: Рӯйхати шаблонҳои SMS
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [SMS]
 *     summary: Сохтани шаблони нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/templates", getSmsTemplates);
router.post("/templates", logAction("SmsTemplate", "create"), createSmsTemplate);

/**
 * @openapi
 * /sms/templates/{id}:
 *   put:
 *     tags: [SMS]
 *     summary: Навсозии шаблон
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [SMS]
 *     summary: Нест кардани шаблон
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/templates/:id", logAction("SmsTemplate", "update"), updateSmsTemplate);
router.delete("/templates/:id", logAction("SmsTemplate", "delete"), deleteSmsTemplate);

/**
 * @openapi
 * /sms/send:
 *   post:
 *     tags: [SMS]
 *     summary: Фиристодани SMS ба Student/Lead/Employee/Graduate (⚠️ smsProvider — stub)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.post("/send", logAction("Sms", "send"), sendSms);

/**
 * @openapi
 * /sms/history:
 *   get:
 *     tags: [SMS]
 *     summary: Таърихи SMS-ҳои фиристодашуда
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/history", getSmsHistory);

export default router;
