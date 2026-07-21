import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchesChart,
} from "./branches.controller";

const router = Router();

/**
 * @openapi
 * /branches/chart:
 *   get:
 *     tags: [Branches]
 *     summary: Диаграммаи бақайдгирии донишҷӯён аз рӯи филиал ва моҳ
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 */
router.get("/chart", getBranchesChart);

/**
 * @openapi
 * /branches:
 *   get:
 *     tags: [Branches]
 *     summary: Рӯйхати филиалҳо (бо шумораи гурӯҳ/донишҷӯ)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Branches]
 *     summary: Сохтани филиали нав
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Сохта шуд }
 */
router.get("/", getBranches);
router.post("/", logAction("Branch", "create"), createBranch);

/**
 * @openapi
 * /branches/{id}:
 *   get:
 *     tags: [Branches]
 *     summary: Гирифтани як филиал
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Ёфт нашуд }
 *   put:
 *     tags: [Branches]
 *     summary: Навсозии филиал
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 *   delete:
 *     tags: [Branches]
 *     summary: Нест кардани филиал
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 */
router.get("/:id", getBranchById);
router.put("/:id", logAction("Branch", "update"), updateBranch);
router.delete("/:id", logAction("Branch", "delete"), deleteBranch);

export default router;
