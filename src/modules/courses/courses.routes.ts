import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "./courses.controller";

const router = Router();

/**
 * @openapi
 * /courses:
 *   get:
 *     tags: [Courses]
 *     summary: Рӯйхати курсҳо (pagination/search)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Courses]
 *     summary: Сохтани курси нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/", getCourses);
router.post("/", logAction("Course", "create"), createCourse);

/**
 * @openapi
 * /courses/{id}:
 *   get:
 *     tags: [Courses]
 *     summary: Гирифтани як курс
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK }, 404: { description: Ёфт нашуд } }
 *   put:
 *     tags: [Courses]
 *     summary: Навсозии курс
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Courses]
 *     summary: Нест кардани курс
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/:id", getCourseById);
router.put("/:id", logAction("Course", "update"), updateCourse);
router.delete("/:id", logAction("Course", "delete"), deleteCourse);

export default router;
