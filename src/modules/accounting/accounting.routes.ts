import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import { getBudgets, createBudget, updateBudget, deleteBudget, getBudgetChart } from "./budget.controller";
import { getSalaries, createSalary, updateSalary, deleteSalary } from "./salary.controller";
import { getAvans, createAvans, updateAvans, deleteAvans } from "./avans.controller";
import { getDebtors, createDebtor, updateDebtor, deleteDebtor, exportDebtors } from "./debtors.controller";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "./expenses.controller";

const router = Router();

router.get("/budget/chart", getBudgetChart);
router.get("/budget", getBudgets);
router.post("/budget", logAction("Budget", "create"), createBudget);
router.put("/budget/:id", logAction("Budget", "update"), updateBudget);
router.delete("/budget/:id", logAction("Budget", "delete"), deleteBudget);

router.get("/salary", getSalaries);
router.post("/salary", logAction("Salary", "create"), createSalary);
router.put("/salary/:id", logAction("Salary", "update"), updateSalary);
router.delete("/salary/:id", logAction("Salary", "delete"), deleteSalary);

router.get("/avans", getAvans);
router.post("/avans", logAction("Avans", "create"), createAvans);
router.put("/avans/:id", logAction("Avans", "update"), updateAvans);
router.delete("/avans/:id", logAction("Avans", "delete"), deleteAvans);

router.get("/debtors/export", exportDebtors);
router.get("/debtors", getDebtors);
router.post("/debtors", logAction("Debtor", "create"), createDebtor);
router.put("/debtors/:id", logAction("Debtor", "update"), updateDebtor);
router.delete("/debtors/:id", logAction("Debtor", "delete"), deleteDebtor);

router.get("/expenses", getExpenses);
router.post("/expenses", logAction("Expense", "create"), createExpense);
router.put("/expenses/:id", logAction("Expense", "update"), updateExpense);
router.delete("/expenses/:id", logAction("Expense", "delete"), deleteExpense);

export default router;
