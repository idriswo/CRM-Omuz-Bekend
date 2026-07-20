import { Router } from "express";
import branchesRoutes from "../modules/branches/branches.routes";

const router = Router();

router.use("/branches", branchesRoutes);

// Дигар модулҳо (students, groups, employees, ...) дар фазаҳои навбатӣ инҷо илова мешаванд.

export default router;
