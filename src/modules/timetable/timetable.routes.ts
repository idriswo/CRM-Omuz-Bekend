import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import {
  getTimetable,
  getTimetableEntryById,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
} from "./timetable.controller";

const router = Router();

/**
 * @openapi
 * /timetable:
 *   get:
 *     tags: [Timetable]
 *     summary: Ҷадвали дарсҳо (view=day|week|month, + repeat_days)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: view, schema: { type: string, enum: [day, week, month] } }
 *       - { in: query, name: date, schema: { type: string, format: date } }
 *       - { in: query, name: group_id, schema: { type: integer } }
 *       - { in: query, name: mentor_id, schema: { type: integer } }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Timetable]
 *     summary: Сохтани дарси нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/", getTimetable);
router.post("/", logAction("TimetableEntry", "create"), createTimetableEntry);

/**
 * @openapi
 * /timetable/{id}:
 *   get:
 *     tags: [Timetable]
 *     summary: Гирифтани як дарс
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   put:
 *     tags: [Timetable]
 *     summary: Навсозии дарс
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Timetable]
 *     summary: Нест кардани дарс
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/:id", getTimetableEntryById);
router.put("/:id", logAction("TimetableEntry", "update"), updateTimetableEntry);
router.delete("/:id", logAction("TimetableEntry", "delete"), deleteTimetableEntry);

export default router;
