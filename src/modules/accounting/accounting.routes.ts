import { Router } from "express";
import { getBudgets, createBudget, updateBudget, deleteBudget, getBudgetChart } from "./budget.controller";
import { getSalaries, createSalary, updateSalary, deleteSalary } from "./salary.controller";
import { getAvans, createAvans, updateAvans, deleteAvans } from "./avans.controller";
import { getDebtors, createDebtor, updateDebtor, deleteDebtor, exportDebtors } from "./debtors.controller";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "./expenses.controller";

const router = Router();

router.get("/budget/chart", getBudgetChart);
router.get("/budget", getBudgets);
router.post("/budget", createBudget);
router.put("/budget/:id", updateBudget);
router.delete("/budget/:id", deleteBudget);

router.get("/salary", getSalaries);
router.post("/salary", createSalary);
router.put("/salary/:id", updateSalary);
router.delete("/salary/:id", deleteSalary);

router.get("/avans", getAvans);
router.post("/avans", createAvans);
router.put("/avans/:id", updateAvans);
router.delete("/avans/:id", deleteAvans);

router.get("/debtors/export", exportDebtors);
router.get("/debtors", getDebtors);
router.post("/debtors", createDebtor);
router.put("/debtors/:id", updateDebtor);
router.delete("/debtors/:id", deleteDebtor);

router.get("/expenses", getExpenses);
router.post("/expenses", createExpense);
router.put("/expenses/:id", updateExpense);
router.delete("/expenses/:id", deleteExpense);

export default router;
