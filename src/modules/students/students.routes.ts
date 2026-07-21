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

router.get("/graduates/stats", getGraduatesStats);
router.get("/graduates", getGraduates);
router.put("/graduates/:id", logAction("Student", "update-graduate"), updateGraduate);
router.post("/enroll", logAction("Student", "enroll"), enrollStudent);

router.get("/", getStudents);
router.get("/:id", getStudentById);
router.post("/", upload.single("photo"), logAction("Student", "create"), createStudent);
router.put("/:id", upload.single("photo"), logAction("Student", "update"), updateStudent);
router.delete("/:id", logAction("Student", "delete"), deleteStudent);

export default router;
