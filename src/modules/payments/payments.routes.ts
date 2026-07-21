import { Router } from "express";
import { getPayments, createPayment, updatePayment, deletePayment, exportPayments } from "./payments.controller";

const router = Router();

router.get("/export", exportPayments);
router.get("/", getPayments);
router.post("/", createPayment);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);

export default router;
