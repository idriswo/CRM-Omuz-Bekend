import { Router } from "express";
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
router.post("/", createTimetableEntry);
router.put("/:id", updateTimetableEntry);
router.delete("/:id", deleteTimetableEntry);

export default router;
