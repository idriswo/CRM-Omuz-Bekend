import { Router } from "express";
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
router.put("/mentor-levels/:id", updateMentorLevel);

router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
