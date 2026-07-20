import { Router } from "express";
import { upload } from "../../middlewares/upload.middleware";
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
router.put("/graduates/:id", updateGraduate);
router.post("/enroll", enrollStudent);

router.get("/", getStudents);
router.get("/:id", getStudentById);
router.post("/", upload.single("photo"), createStudent);
router.put("/:id", upload.single("photo"), updateStudent);
router.delete("/:id", deleteStudent);

export default router;
