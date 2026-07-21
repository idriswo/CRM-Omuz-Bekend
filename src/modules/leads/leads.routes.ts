import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
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
router.post("/coupons", logAction("Coupon", "create"), createCoupon);
router.post("/transfer", logAction("Lead", "transfer"), transferLeads);
router.post("/:id/convert-to-client", logAction("Lead", "convert-to-client"), convertLeadToClient);

router.get("/", getLeads);
router.get("/:id", getLeadById);
router.post("/", logAction("Lead", "create"), createLead);
router.put("/:id", logAction("Lead", "update"), updateLead);
router.delete("/:id", logAction("Lead", "delete"), deleteLead);

export default router;
