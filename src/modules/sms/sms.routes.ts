import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import {
  getSmsTemplates,
  createSmsTemplate,
  updateSmsTemplate,
  deleteSmsTemplate,
  sendSms,
  getSmsHistory,
} from "./sms.controller";

const router = Router();

router.get("/templates", getSmsTemplates);
router.post("/templates", logAction("SmsTemplate", "create"), createSmsTemplate);
router.put("/templates/:id", logAction("SmsTemplate", "update"), updateSmsTemplate);
router.delete("/templates/:id", logAction("SmsTemplate", "delete"), deleteSmsTemplate);

router.post("/send", logAction("Sms", "send"), sendSms);
router.get("/history", getSmsHistory);

export default router;
