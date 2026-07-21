import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import {
  getTimetable,
  getTimetableEntryById,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
} from "./timetable.controller";

const router = Router();

router.get("/", getTimetable);
router.get("/:id", getTimetableEntryById);
router.post("/", logAction("TimetableEntry", "create"), createTimetableEntry);
router.put("/:id", logAction("TimetableEntry", "update"), updateTimetableEntry);
router.delete("/:id", logAction("TimetableEntry", "delete"), deleteTimetableEntry);

export default router;
