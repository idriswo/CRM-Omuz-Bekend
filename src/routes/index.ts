import { Router } from "express";
import branchesRoutes from "../modules/branches/branches.routes";
import coursesRoutes from "../modules/courses/courses.routes";
import leadsRoutes from "../modules/leads/leads.routes";

const router = Router();

router.use("/branches", branchesRoutes);
router.use("/courses", coursesRoutes);
router.use("/leads", leadsRoutes);

// Дигар модулҳо (students, groups, employees, ...) дар фазаҳои навбатӣ инҷо илова мешаванд.

export default router;
