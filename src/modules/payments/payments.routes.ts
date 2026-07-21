import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import { getPayments, createPayment, updatePayment, deletePayment, exportPayments } from "./payments.controller";

const router = Router();

router.get("/export", exportPayments);
router.get("/", getPayments);
router.post("/", logAction("Payment", "create"), createPayment);
router.put("/:id", logAction("Payment", "update"), updatePayment);
router.delete("/:id", logAction("Payment", "delete"), deletePayment);

export default router;
