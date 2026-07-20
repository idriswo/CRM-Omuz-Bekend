import { Router } from "express";
import {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupsStats,
  getGroupJournal,
  addJournalWeek,
  upsertJournalEntry,
} from "./groups.controller";

const router = Router();

router.get("/stats", getGroupsStats);

router.get("/:id/journal", getGroupJournal);
router.post("/:id/journal/week", addJournalWeek);
router.put("/:id/journal/:weekId/students/:studentId", upsertJournalEntry);

router.get("/", getGroups);
router.get("/:id", getGroupById);
router.post("/", createGroup);
router.put("/:id", updateGroup);
router.delete("/:id", deleteGroup);

export default router;
