import { Router } from "express";
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
router.post("/", createBranch);
router.put("/:id", updateBranch);
router.delete("/:id", deleteBranch);

export default router;
