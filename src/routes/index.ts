import { Router } from "express";
import branchesRoutes from "../modules/branches/branches.routes";
import coursesRoutes from "../modules/courses/courses.routes";
import leadsRoutes from "../modules/leads/leads.routes";
import studentsRoutes from "../modules/students/students.routes";
import employeesRoutes from "../modules/employees/employees.routes";
import groupsRoutes from "../modules/groups/groups.routes";
import timetableRoutes from "../modules/timetable/timetable.routes";
import paymentsRoutes from "../modules/payments/payments.routes";
import accountingRoutes from "../modules/accounting/accounting.routes";
import administrationRoutes from "../modules/administration/administration.routes";
import smsRoutes from "../modules/sms/sms.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";

const router = Router();

router.use("/branches", branchesRoutes);
router.use("/courses", coursesRoutes);
router.use("/leads", leadsRoutes);
router.use("/students", studentsRoutes);
router.use("/employees", employeesRoutes);
router.use("/groups", groupsRoutes);
router.use("/timetable", timetableRoutes);
router.use("/payments", paymentsRoutes);
router.use("/accounting", accountingRoutes);
router.use("/", administrationRoutes); // /users, /roles, /permissions, /logs
router.use("/sms", smsRoutes);
router.use("/dashboard", dashboardRoutes);

// Дигар модулҳо (students, groups, employees, ...) дар фазаҳои навбатӣ инҷо илова мешаванд.

export default router;
