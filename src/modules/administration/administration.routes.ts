import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import { getUsers, createUser, updateUser, deleteUser } from "./users.controller";
import { getRoles, createRole, updateRole, deleteRole } from "./roles.controller";
import { getPermissions, createPermission, updatePermission, deletePermission } from "./permissions.controller";
import { getLogs } from "./logs.controller";

const router = Router();

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Administration]
 *     summary: Рӯйхати корбарон (пароль дар ҷавоб нест)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Administration]
 *     summary: Сохтани корбари нав (аз ҷониби админ)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/users", getUsers);
router.post("/users", logAction("User", "create"), createUser);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     tags: [Administration]
 *     summary: Навсозии корбар
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Administration]
 *     summary: Нест кардани корбар
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/users/:id", logAction("User", "update"), updateUser);
router.delete("/users/:id", logAction("User", "delete"), deleteUser);

/**
 * @openapi
 * /roles:
 *   get:
 *     tags: [Administration]
 *     summary: Рӯйхати нақшҳо (роль)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Administration]
 *     summary: Сохтани нақши нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/roles", getRoles);
router.post("/roles", logAction("Role", "create"), createRole);

/**
 * @openapi
 * /roles/{id}:
 *   put:
 *     tags: [Administration]
 *     summary: Навсозии нақш
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Administration]
 *     summary: Нест кардани нақш
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/roles/:id", logAction("Role", "update"), updateRole);
router.delete("/roles/:id", logAction("Role", "delete"), deleteRole);

/**
 * @openapi
 * /permissions:
 *   get:
 *     tags: [Administration]
 *     summary: Рӯйхати иҷозатҳо (филтр бо group/role_id)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Administration]
 *     summary: Сохтани иҷозати нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/permissions", getPermissions);
router.post("/permissions", logAction("Permission", "create"), createPermission);

/**
 * @openapi
 * /permissions/{id}:
 *   put:
 *     tags: [Administration]
 *     summary: Навсозии иҷозат
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Administration]
 *     summary: Нест кардани иҷозат
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/permissions/:id", logAction("Permission", "update"), updatePermission);
router.delete("/permissions/:id", logAction("Permission", "delete"), deletePermission);

/**
 * @openapi
 * /logs:
 *   get:
 *     tags: [Administration]
 *     summary: Рӯйхати логи амалҳо (auto-log аз ҳамаи мутатсияҳо)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: user_id, schema: { type: integer } }
 *       - { in: query, name: entity, schema: { type: string } }
 *       - { in: query, name: action, schema: { type: string } }
 *     responses: { 200: { description: OK } }
 */
router.get("/logs", getLogs);

export default router;
