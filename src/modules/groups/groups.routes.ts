import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import { authorize } from "../../middlewares/rbac.middleware";
import { ROLES } from "../../constants/roles";
import {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupsStats,
  getGroupJournal,
  addJournalWeek,
  upsertJournalEntry,
  getGroupSchedule,
  createGroupScheduleEntry,
  updateGroupScheduleEntry,
  deleteGroupScheduleEntry,
} from "./groups.controller";

const router = Router();
router.use(authorize(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DIRECTOR));

/**
 * @openapi
 * /groups/stats:
 *   get:
 *     tags: [Groups]
 *     summary: Статистикаи гурӯҳҳо аз рӯи tag
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/stats", getGroupsStats);

/**
 * @openapi
 * /groups/{id}/journal:
 *   get:
 *     tags: [Groups]
 *     summary: Гирифтани журнали гурӯҳ (ҳафтаҳо + давомот)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/:id/journal", getGroupJournal);

/**
 * @openapi
 * /groups/{id}/journal/week:
 *   post:
 *     tags: [Groups]
 *     summary: Илова кардани ҳафтаи нав ба журнал
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.post("/:id/journal/week", logAction("JournalWeek", "create"), addJournalWeek);

/**
 * @openapi
 * /groups/{id}/journal/{weekId}/students/{studentId}:
 *   put:
 *     tags: [Groups]
 *     summary: Upsert-и сабти давомот/бал барои як донишҷӯ дар як рӯз
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: weekId, required: true, schema: { type: integer } }
 *       - { in: path, name: studentId, required: true, schema: { type: integer } }
 *     responses: { 200: { description: OK } }
 */
router.put("/:id/journal/:weekId/students/:studentId", logAction("JournalEntry", "upsert"), upsertJournalEntry);

/**
 * @openapi
 * /groups/{id}/schedule:
 *   get:
 *     tags: [Groups]
 *     summary: Ҷадвали дарсҳои ин гурӯҳ
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Groups]
 *     summary: Илова кардани дарс ба ҷадвали ин гурӯҳ
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/:id/schedule", getGroupSchedule);
router.post("/:id/schedule", logAction("TimetableEntry", "create"), createGroupScheduleEntry);

/**
 * @openapi
 * /groups/{id}/schedule/{entryId}:
 *   put:
 *     tags: [Groups]
 *     summary: Навсозии дарси ин гурӯҳ
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: entryId, required: true, schema: { type: integer } }
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Groups]
 *     summary: Нест кардани дарси ин гурӯҳ
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: entryId, required: true, schema: { type: integer } }
 *     responses: { 200: { description: OK } }
 */
router.put("/:id/schedule/:entryId", logAction("TimetableEntry", "update"), updateGroupScheduleEntry);
router.delete("/:id/schedule/:entryId", logAction("TimetableEntry", "delete"), deleteGroupScheduleEntry);

/**
 * @openapi
 * /groups:
 *   get:
 *     tags: [Groups]
 *     summary: Рӯйхати гурӯҳҳо (pagination/search/course_id/branch_id/status/tag)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Groups]
 *     summary: Сохтани гурӯҳи нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/", getGroups);
router.post("/", logAction("Group", "create"), createGroup);

/**
 * @openapi
 * /groups/{id}:
 *   get:
 *     tags: [Groups]
 *     summary: Гирифтани як гурӯҳ
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   put:
 *     tags: [Groups]
 *     summary: Навсозии гурӯҳ
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Groups]
 *     summary: Нест кардани гурӯҳ
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/:id", getGroupById);
router.put("/:id", logAction("Group", "update"), updateGroup);
router.delete("/:id", logAction("Group", "delete"), deleteGroup);

export default router;
