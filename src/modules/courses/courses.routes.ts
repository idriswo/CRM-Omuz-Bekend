import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "./courses.controller";

const router = Router();

router.get("/", getCourses);
router.get("/:id", getCourseById);
router.post("/", logAction("Course", "create"), createCourse);
router.put("/:id", logAction("Course", "update"), updateCourse);
router.delete("/:id", logAction("Course", "delete"), deleteCourse);

export default router;
