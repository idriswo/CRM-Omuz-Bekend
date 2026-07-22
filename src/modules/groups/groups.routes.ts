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
  addJournalDate,
  updateJournalDate,
  deleteJournalDate,
  deleteJournalWeek,
  upsertJournalEntry,
  setJournalSheet,
  syncJournalSheet,
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
 * /groups/{id}/journal/{weekId}/date:
 *   post:
 *     tags: [Groups]
 *     summary: Илова кардани санаи нав ба ҳафтаи журнал
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: weekId, required: true, schema: { type: integer, description: week_number } }
 *     responses: { 201: { description: Илова шуд } }
 */
/**
 * @openapi
 * /groups/{id}/journal/sheet:
 *   put:
 *     tags: [Groups]
 *     summary: Нигоҳ доштани линки Google Sheets-и ин гурӯҳ (ва якбора синхронизатсия)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     requestBody:
 *       content: { application/json: { schema: { type: object, properties: { sheet_url: { type: string } } } } }
 *     responses: { 200: { description: OK } }
 */
router.put("/:id/journal/sheet", logAction("Group", "set-sheet"), setJournalSheet);

/**
 * @openapi
 * /groups/{id}/journal/sync:
 *   post:
 *     tags: [Groups]
 *     summary: Дастӣ фиристодани журнал ба Google Sheets
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.post("/:id/journal/sync", logAction("Group", "sync-sheet"), syncJournalSheet);

router.post("/:id/journal/:weekId/date", logAction("JournalWeek", "add-date"), addJournalDate);

/**
 * @openapi
 * /groups/{id}/journal/{weekId}/date/{index}:
 *   put:
 *     tags: [Groups]
 *     summary: Иваз кардани санаи index-ум дар ҳафта
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Groups]
 *     summary: Нест кардани санаи index-ум (бо сабтҳои он рӯз)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.put("/:id/journal/:weekId/date/:index", logAction("JournalWeek", "update-date"), updateJournalDate);
router.delete("/:id/journal/:weekId/date/:index", logAction("JournalWeek", "delete-date"), deleteJournalDate);

/**
 * @openapi
 * /groups/{id}/journal/{weekId}:
 *   delete:
 *     tags: [Groups]
 *     summary: Нест кардани ҳафтаи журнал
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.delete("/:id/journal/:weekId", logAction("JournalWeek", "delete"), deleteJournalWeek);

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
