import { Router } from "express";
import { upload } from "../../middlewares/upload.middleware";
import { logAction } from "../../middlewares/log.middleware";
import { authorize, selfStudentOr, requireCanAddStudents } from "../../middlewares/rbac.middleware";
import { ROLES } from "../../constants/roles";
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getGraduates,
  updateGraduate,
  getGraduatesStats,
  getGraduateGroups,
  getGraduateById,
  enrollStudent,
  getEnrollChart,
  getMyProfile,
  getMyGroups,
  getMyGroupmates,
  getMyScores,
  getMyCoins,
  getStudentCoins,
  addCoins,
  spendCoins,
  getLeaders,
  getLeadersWinners,
  getLeftCoursesList,
  getLeftCoursesChart,
  getLeftCoursesGroups,
  getStudentActivity,
} from "./students.controller";

const router = Router();
const STAFF = [ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DIRECTOR] as const;

/**
 * @openapi
 * /students/me:
 *   get:
 *     tags: [Students]
 *     summary: Профили худи донишҷӯи ворид шуда (role=student)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/me", authorize(ROLES.STUDENT), getMyProfile);
router.get("/me/groups", authorize(ROLES.STUDENT), getMyGroups);
router.get("/me/groupmates", authorize(ROLES.STUDENT), getMyGroupmates);
router.get("/me/scores", authorize(ROLES.STUDENT), getMyScores);
router.get("/me/coins", authorize(ROLES.STUDENT), getMyCoins);

/**
 * @openapi
 * /students/graduates/stats:
 *   get:
 *     tags: [Students]
 *     summary: Статистикаи хатмкунандагон аз рӯи tag
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/graduates/stats", authorize(...STAFF), getGraduatesStats);
/**
 * @openapi
 * /students/graduates/groups:
 *   get:
 *     tags: [Students]
 *     summary: Гурӯҳбандии хатмкунандагон (шумора дар ҳар гурӯҳ)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/graduates/groups", authorize(...STAFF), getGraduateGroups);
router.get("/graduates", authorize(...STAFF), getGraduates);
router.put("/graduates/:id", authorize(...STAFF), logAction("Student", "update-graduate"), updateGraduate);
/**
 * @openapi
 * /students/graduates/{id}:
 *   get:
 *     tags: [Students]
 *     summary: Маълумоти пурраи як хатмкунанда
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/graduates/:id", authorize(...STAFF), getGraduateById);

/**
 * @openapi
 * /students/leaders:
 *   get:
 *     tags: [Students]
 *     summary: Рейтинги донишҷӯён аз рӯи coin
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/leaders/winners", authorize(...STAFF), getLeadersWinners);
router.get("/leaders", authorize(...STAFF), getLeaders);

/**
 * @openapi
 * /students/left-courses:
 *   get:
 *     tags: [Students]
 *     summary: Донишҷӯёне, ки курсро тарк кардаанд (status=inactive)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/left-courses/chart", authorize(...STAFF), getLeftCoursesChart);
router.get("/left-courses/groups", authorize(...STAFF), getLeftCoursesGroups);
router.get("/left-courses", authorize(...STAFF), getLeftCoursesList);

/**
 * @openapi
 * /students/activity:
 *   get:
 *     tags: [Students]
 *     summary: Сабтҳои охирини амал вобаста ба донишҷӯён (аз Log)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/activity", authorize(...STAFF), getStudentActivity);

router.post("/enroll", authorize(...STAFF), logAction("Student", "enroll"), enrollStudent);
/**
 * @openapi
 * /students/enroll/chart:
 *   get:
 *     tags: [Students]
 *     summary: Диаграммаи бақайдгирии донишҷӯён аз рӯи моҳ
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/enroll/chart", authorize(...STAFF), getEnrollChart);

/**
 * @openapi
 * /students/{id}/coins:
 *   get:
 *     tags: [Students]
 *     summary: Coin-и як донишҷӯ (худаш ё admin/superadmin/director)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Students]
 *     summary: Иловаи дастии coin
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 201: { description: Илова шуд } }
 */
router.get("/:id/coins", selfStudentOr(...STAFF), getStudentCoins);
router.post("/:id/coins", authorize(...STAFF), logAction("Coin", "add"), addCoins);
router.post("/:id/coins/spend", authorize(...STAFF), logAction("Coin", "spend"), spendCoins);

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
 *     summary: Сохтани донишҷӯи нав (multipart/form-data — сурат) + login худкор
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content: { multipart/form-data: {} }
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/", authorize(...STAFF), getStudents);
router.get("/:id", selfStudentOr(...STAFF), getStudentById);
router.post("/", authorize(...STAFF), requireCanAddStudents, upload.single("photo"), logAction("Student", "create"), createStudent);

/**
 * @openapi
 * /students/{id}:
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
router.put("/:id", authorize(...STAFF), upload.single("photo"), logAction("Student", "update"), updateStudent);
router.delete("/:id", authorize(...STAFF), logAction("Student", "delete"), deleteStudent);

export default router;
