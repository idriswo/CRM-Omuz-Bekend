import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import { authorize } from "../../middlewares/rbac.middleware";
import { ROLES } from "../../constants/roles";
import { getBudgets, createBudget, updateBudget, deleteBudget, getBudgetChart } from "./budget.controller";
import { getSalaries, createSalary, updateSalary, deleteSalary } from "./salary.controller";
import { getAvans, createAvans, updateAvans, deleteAvans } from "./avans.controller";
import { getDebtors, createDebtor, updateDebtor, deleteDebtor, exportDebtors } from "./debtors.controller";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "./expenses.controller";

const router = Router();
// Финанс/ойлик — фақат director (admin ва superadmin дастрасӣ надоранд)
router.use(authorize(ROLES.DIRECTOR));

/**
 * @openapi
 * /accounting/budget/chart:
 *   get:
 *     tags: [Accounting]
 *     summary: Диаграммаи буҷа аз рӯи моҳ (allocated/spent)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: year, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.get("/budget/chart", getBudgetChart);

/**
 * @openapi
 * /accounting/budget:
 *   get:
 *     tags: [Accounting]
 *     summary: Рӯйхати буҷа
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Accounting]
 *     summary: Сохтани сатри буҷаи нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/budget", getBudgets);
router.post("/budget", logAction("Budget", "create"), createBudget);

/**
 * @openapi
 * /accounting/budget/{id}:
 *   put:
 *     tags: [Accounting]
 *     summary: Навсозии буҷа
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Accounting]
 *     summary: Нест кардани буҷа
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/budget/:id", logAction("Budget", "update"), updateBudget);
router.delete("/budget/:id", logAction("Budget", "delete"), deleteBudget);

/**
 * @openapi
 * /accounting/salary:
 *   get:
 *     tags: [Accounting]
 *     summary: Рӯйхати маошҳо
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Accounting]
 *     summary: Сабти маоши нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/salary", getSalaries);
router.post("/salary", logAction("Salary", "create"), createSalary);

/**
 * @openapi
 * /accounting/salary/{id}:
 *   put:
 *     tags: [Accounting]
 *     summary: Навсозии маош
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Accounting]
 *     summary: Нест кардани маош
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/salary/:id", logAction("Salary", "update"), updateSalary);
router.delete("/salary/:id", logAction("Salary", "delete"), deleteSalary);

/**
 * @openapi
 * /accounting/avans:
 *   get:
 *     tags: [Accounting]
 *     summary: Рӯйхати аванс
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Accounting]
 *     summary: Сабти авансии нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/avans", getAvans);
router.post("/avans", logAction("Avans", "create"), createAvans);

/**
 * @openapi
 * /accounting/avans/{id}:
 *   put:
 *     tags: [Accounting]
 *     summary: Навсозии аванс
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Accounting]
 *     summary: Нест кардани аванс
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/avans/:id", logAction("Avans", "update"), updateAvans);
router.delete("/avans/:id", logAction("Avans", "delete"), deleteAvans);

/**
 * @openapi
 * /accounting/debtors/export:
 *   get:
 *     tags: [Accounting]
 *     summary: Экспорти қарздорон ба xlsx
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Файли xlsx } }
 */
router.get("/debtors/export", exportDebtors);

/**
 * @openapi
 * /accounting/debtors:
 *   get:
 *     tags: [Accounting]
 *     summary: Рӯйхати қарздорон (status худкор ҳисоб мешавад)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Accounting]
 *     summary: Сабти қарздори нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/debtors", getDebtors);
router.post("/debtors", logAction("Debtor", "create"), createDebtor);

/**
 * @openapi
 * /accounting/debtors/{id}:
 *   put:
 *     tags: [Accounting]
 *     summary: Навсозии қарздор
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Accounting]
 *     summary: Нест кардани қарздор
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/debtors/:id", logAction("Debtor", "update"), updateDebtor);
router.delete("/debtors/:id", logAction("Debtor", "delete"), deleteDebtor);

/**
 * @openapi
 * /accounting/expenses:
 *   get:
 *     tags: [Accounting]
 *     summary: Рӯйхати хароҷот
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Accounting]
 *     summary: Сабти хароҷоти нав
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Сохта шуд } }
 */
router.get("/expenses", getExpenses);
router.post("/expenses", logAction("Expense", "create"), createExpense);

/**
 * @openapi
 * /accounting/expenses/{id}:
 *   put:
 *     tags: [Accounting]
 *     summary: Навсозии хароҷот
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Accounting]
 *     summary: Нест кардани хароҷот
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: OK } }
 */
router.put("/expenses/:id", logAction("Expense", "update"), updateExpense);
router.delete("/expenses/:id", logAction("Expense", "delete"), deleteExpense);

export default router;
