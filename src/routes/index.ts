import { Router } from "express";
import branchesRoutes from "../modules/branches/branches.routes";
import coursesRoutes from "../modules/courses/courses.routes";
import leadsRoutes from "../modules/leads/leads.routes";
import studentsRoutes from "../modules/students/students.routes";
import employeesRoutes from "../modules/employees/employees.routes";
import groupsRoutes from "../modules/groups/groups.routes";
import timetableRoutes from "../modules/timetable/timetable.routes";

const router = Router();

router.use("/branches", branchesRoutes);
router.use("/courses", coursesRoutes);
router.use("/leads", leadsRoutes);
router.use("/students", studentsRoutes);
router.use("/employees", employeesRoutes);
router.use("/groups", groupsRoutes);
router.use("/timetable", timetableRoutes);

// Дигар модулҳо (students, groups, employees, ...) дар фазаҳои навбатӣ инҷо илова мешаванд.

export default router;
