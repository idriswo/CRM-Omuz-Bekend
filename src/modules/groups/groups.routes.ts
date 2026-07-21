import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
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
router.post("/:id/journal/week", logAction("JournalWeek", "create"), addJournalWeek);
router.put("/:id/journal/:weekId/students/:studentId", logAction("JournalEntry", "upsert"), upsertJournalEntry);

router.get("/", getGroups);
router.get("/:id", getGroupById);
router.post("/", logAction("Group", "create"), createGroup);
router.put("/:id", logAction("Group", "update"), updateGroup);
router.delete("/:id", logAction("Group", "delete"), deleteGroup);

export default router;
