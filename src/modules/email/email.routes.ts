import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import { authorize } from "../../middlewares/rbac.middleware";
import { ROLES } from "../../constants/roles";
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  sendBulkEmail,
  getEmailHistory,
  getRecipientsByGroup,
  getRecipientsStudents,
  getRecipientsMentors,
  getRecipientsGraduates,
} from "./email.controller";

const router = Router();
router.use(authorize(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DIRECTOR));

/**
 * @openapi
 * /email/recipients/group:
 *   get:
 *     tags: [Email]
 *     summary: Донишҷӯёни як гурӯҳ, ки email доранд
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: group_id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK }, 400: { description: group_id нест } }
 */
router.get("/recipients/group", getRecipientsByGroup);
/**
 * @openapi
 * /email/recipients/students:
 *   get:
 *     tags: [Email]
 *     summary: Ҳамаи донишҷӯёне, ки email доранд
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/recipients/students", getRecipientsStudents);
/**
 * @openapi
 * /email/recipients/mentors:
 *   get:
 *     tags: [Email]
 *     summary: Кормандоне, ки email доранд
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/recipients/mentors", getRecipientsMentors);
/**
 * @openapi
 * /email/recipients/graduates:
 *   get:
 *     tags: [Email]
 *     summary: Хатмкунандагоне, ки email доранд
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/recipients/graduates", getRecipientsGraduates);

/**
 * @openapi
 * /email/templates:
 *   get:
 *     tags: [Email]
 *     summary: Рӯйхати шаблонҳои email
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Email]
 *     summary: Сохтани шаблони нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд }, 400: { description: title/description нест } }
 */
router.get("/templates", getEmailTemplates);
router.post("/templates", logAction("EmailTemplate", "create"), createEmailTemplate);
/**
 * @openapi
 * /email/templates/{id}:
 *   put:
 *     tags: [Email]
 *     summary: Навсозии шаблон
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Email]
 *     summary: Нест кардани шаблон
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/templates/:id", logAction("EmailTemplate", "update"), updateEmailTemplate);
router.delete("/templates/:id", logAction("EmailTemplate", "delete"), deleteEmailTemplate);

/**
 * @openapi
 * /email/send:
 *   post:
 *     tags: [Email]
 *     summary: Фиристодани email ба гурӯҳи ретсипиентҳо
 *     description: >
 *       recipient_type: Student | Employee | Graduate.
 *       recipient_ids ҳатман массиви ғайрихолӣ — вагарна паём ба тамоми база мерафт.
 *       Матн ё аз text, ё аз template_id гирифта мешавад.
 *       Агар GMAIL_USER гузошта нашуда бошад, mail_enabled=false бармегардад ва
 *       паём воқеан намеравад (режими stub).
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Натиҷа бо sent_count/failed_count }
 *       400: { description: Маълумоти нодуруст }
 *       404: { description: Шаблон ё суроға ёфт нашуд }
 */
router.post("/send", logAction("Email", "send"), sendBulkEmail);
/**
 * @openapi
 * /email/history:
 *   get:
 *     tags: [Email]
 *     summary: Таърихи паёмҳои фиристодашуда
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/history", getEmailHistory);

export default router;
