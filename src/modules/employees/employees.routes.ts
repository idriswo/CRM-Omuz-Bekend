import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getMentorLevels,
  updateMentorLevel,
} from "./employees.controller";

const router = Router();

/**
 * @openapi
 * /employees/mentor-levels:
 *   get:
 *     tags: [Employees]
 *     summary: Рӯйхати сатҳҳои менторҳо
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/mentor-levels", getMentorLevels);

/**
 * @openapi
 * /employees/mentor-levels/{id}:
 *   put:
 *     tags: [Employees]
 *     summary: Навсозии сатҳи ментор
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/mentor-levels/:id", logAction("MentorLevel", "update"), updateMentorLevel);

/**
 * @openapi
 * /employees:
 *   get:
 *     tags: [Employees]
 *     summary: Рӯйхати кормандон (pagination/search/branch_id/position)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Employees]
 *     summary: Сохтани корманди нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/", getEmployees);
router.post("/", logAction("Employee", "create"), createEmployee);

/**
 * @openapi
 * /employees/{id}:
 *   get:
 *     tags: [Employees]
 *     summary: Гирифтани як корманд
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   put:
 *     tags: [Employees]
 *     summary: Навсозии корманд
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Employees]
 *     summary: Нест кардани корманд
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/:id", getEmployeeById);
router.put("/:id", logAction("Employee", "update"), updateEmployee);
router.delete("/:id", logAction("Employee", "delete"), deleteEmployee);

export default router;
