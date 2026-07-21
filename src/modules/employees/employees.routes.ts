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

router.get("/mentor-levels", getMentorLevels);
router.put("/mentor-levels/:id", logAction("MentorLevel", "update"), updateMentorLevel);

router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.post("/", logAction("Employee", "create"), createEmployee);
router.put("/:id", logAction("Employee", "update"), updateEmployee);
router.delete("/:id", logAction("Employee", "delete"), deleteEmployee);

export default router;
