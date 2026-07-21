import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchesChart,
} from "./branches.controller";

const router = Router();

router.get("/chart", getBranchesChart);
router.get("/", getBranches);
router.get("/:id", getBranchById);
router.post("/", logAction("Branch", "create"), createBranch);
router.put("/:id", logAction("Branch", "update"), updateBranch);
router.delete("/:id", logAction("Branch", "delete"), deleteBranch);

export default router;
