import { Router } from "express";
import { authorize } from "../../middlewares/rbac.middleware";
import { ROLES } from "../../constants/roles";
import {
  getDashboardStats,
  getAttendanceLog,
  getGroupsSummary,
  getLeadsChart,
  getAttendanceChart,
  getIncome,
  getEnrollChart,
  getEmployedGraduates,
  getLeftCourses,
} from "./dashboard.controller";

const router = Router();
router.use(authorize(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DIRECTOR));

/**
 * @openapi
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Умумиятҳо (шумораи донишҷӯён/корбарон/кормандон, давомоти имрӯза)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/stats", getDashboardStats);

/**
 * @openapi
 * /dashboard/attendance-log:
 *   get:
 *     tags: [Dashboard]
 *     summary: Сабтҳои давомот дар як рӯзи муайян
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: date, schema: { type: string, format: date } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/attendance-log", getAttendanceLog);

/**
 * @openapi
 * /dashboard/groups-summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Хулосаи ҳар гурӯҳ (present/absent/income)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/groups-summary", getGroupsSummary);

/**
 * @openapi
 * /dashboard/leads-chart:
 *   get:
 *     tags: [Dashboard]
 *     summary: Диаграммаи лидҳо аз рӯи моҳ
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: year, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/leads-chart", getLeadsChart);

/**
 * @openapi
 * /dashboard/attendance-chart:
 *   get:
 *     tags: [Dashboard]
 *     summary: Диаграммаи давомот дар як моҳ
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: month, schema: { type: string, format: date } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/attendance-chart", getAttendanceChart);

/**
 * @openapi
 * /dashboard/income:
 *   get:
 *     tags: [Dashboard]
 *     summary: Даромад дар як моҳ (умумӣ + аз рӯи рӯз)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: month, schema: { type: string, format: date } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/income", getIncome);

/**
 * @openapi
 * /dashboard/enroll-chart:
 *   get:
 *     tags: [Dashboard]
 *     summary: Диаграммаи бақайдгирии донишҷӯён аз рӯи моҳ
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: year, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/enroll-chart", getEnrollChart);

/**
 * @openapi
 * /dashboard/employed-graduates:
 *   get:
 *     tags: [Dashboard]
 *     summary: Шумораи хатмкунандагони бокор
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/employed-graduates", getEmployedGraduates);

/**
 * @openapi
 * /dashboard/left-courses:
 *   get:
 *     tags: [Dashboard]
 *     summary: Донишҷӯёне, ки курсро тарк кардаанд (status=inactive), аз рӯи гурӯҳ/курс
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get("/left-courses", getLeftCourses);

export default router;
