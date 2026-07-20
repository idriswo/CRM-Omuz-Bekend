import { Router } from "express";
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToClient,
  transferLeads,
  exportLeads,
  getCoupons,
  createCoupon,
} from "./leads.controller";

const router = Router();

router.get("/export", exportLeads);
router.get("/coupons", getCoupons);
router.post("/coupons", createCoupon);
router.post("/transfer", transferLeads);
router.post("/:id/convert-to-client", convertLeadToClient);

router.get("/", getLeads);
router.get("/:id", getLeadById);
router.post("/", createLead);
router.put("/:id", updateLead);
router.delete("/:id", deleteLead);

export default router;
