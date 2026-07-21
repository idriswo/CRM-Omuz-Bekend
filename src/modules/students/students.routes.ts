import { Router } from "express";
import { upload } from "../../middlewares/upload.middleware";
import { logAction } from "../../middlewares/log.middleware";
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getGraduates,
  updateGraduate,
  getGraduatesStats,
  enrollStudent,
} from "./students.controller";

const router = Router();

/**
 * @openapi
 * /students/graduates/stats:
 *   get:
 *     tags: [Students]
 *     summary: Статистикаи хатмкунандагон аз рӯи tag
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/graduates/stats", getGraduatesStats);

/**
 * @openapi
 * /students/graduates:
 *   get:
 *     tags: [Students]
 *     summary: Рӯйхати хатмкунандагон (status=finished)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/graduates", getGraduates);

/**
 * @openapi
 * /students/graduates/{id}:
 *   put:
 *     tags: [Students]
 *     summary: Навсозии маълумоти хатмкунанда (work_place, has_certificate, tag)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/graduates/:id", logAction("Student", "update-graduate"), updateGraduate);

/**
 * @openapi
 * /students/enroll:
 *   post:
 *     tags: [Students]
 *     summary: Сабти донишҷӯ ба гурӯҳ (сохтани донишҷӯи нав, агар лозим бошад)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.post("/enroll", logAction("Student", "enroll"), enrollStudent);

/**
 * @openapi
 * /students:
 *   get:
 *     tags: [Students]
 *     summary: Рӯйхати донишҷӯён (pagination/search/course_id/group_id/status/contract_status)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Students]
 *     summary: Сохтани донишҷӯи нав (multipart/form-data — сурат)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content: { multipart/form-data: {} }
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/", getStudents);
router.get("/:id", getStudentById);
router.post("/", upload.single("photo"), logAction("Student", "create"), createStudent);

/**
 * @openapi
 * /students/{id}:
 *   get:
 *     tags: [Students]
 *     summary: Гирифтани як донишҷӯ
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   put:
 *     tags: [Students]
 *     summary: Навсозии донишҷӯ (multipart/form-data — сурат)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Students]
 *     summary: Нест кардани донишҷӯ
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/:id", upload.single("photo"), logAction("Student", "update"), updateStudent);
router.delete("/:id", logAction("Student", "delete"), deleteStudent);

export default router;
