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
  enrollStudent,
  getMyProfile,
  getMyGroups,
  getMyGroupmates,
  getMyScores,
  getMyCoins,
  getStudentCoins,
  addCoins,
  spendCoins,
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
/**
 * @openapi
 * /students/me/groups:
 *   get:
 *     tags: [Students]
 *     summary: Гурӯҳҳои худи донишҷӯ
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/me/groups", authorize(ROLES.STUDENT), getMyGroups);
/**
 * @openapi
 * /students/me/groupmates:
 *   get:
 *     tags: [Students]
 *     summary: Ҳамкурсҳои донишҷӯ (аз рӯи гурӯҳҳои умумӣ)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/me/groupmates", authorize(ROLES.STUDENT), getMyGroupmates);
/**
 * @openapi
 * /students/me/scores:
 *   get:
 *     tags: [Students]
 *     summary: Баллҳо/давомоти худи донишҷӯ (аз Journal)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/me/scores", authorize(ROLES.STUDENT), getMyScores);
/**
 * @openapi
 * /students/me/coins:
 *   get:
 *     tags: [Students]
 *     summary: Coin-и худи донишҷӯ (баланс + таърих)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
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
router.get("/graduates", authorize(...STAFF), getGraduates);
router.put("/graduates/:id", authorize(...STAFF), logAction("Student", "update-graduate"), updateGraduate);
router.post("/enroll", authorize(...STAFF), logAction("Student", "enroll"), enrollStudent);

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
/**
 * @openapi
 * /students/{id}/coins/spend:
 *   post:
 *     tags: [Students]
 *     summary: Харҷи coin (масалан барои тахфиф/мукофот)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
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
