import { Router } from "express";
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

router.get("/stats", getDashboardStats);
router.get("/attendance-log", getAttendanceLog);
router.get("/groups-summary", getGroupsSummary);
router.get("/leads-chart", getLeadsChart);
router.get("/attendance-chart", getAttendanceChart);
router.get("/income", getIncome);
router.get("/enroll-chart", getEnrollChart);
router.get("/employed-graduates", getEmployedGraduates);
router.get("/left-courses", getLeftCourses);

export default router;
