import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { ROLES, RoleName } from "../constants/roles";
import { prisma } from "../utils/prisma";

// Танҳо ба нақшҳои дар рӯйхат буда иҷозат медиҳад
export function authorize(...allowedRoles: RoleName[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role as RoleName | undefined;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Дастрасӣ манъ аст" });
    }
    next();
  };
}

// Барои GET /students/:id ва монанди он: student фақат метавонад профили худашро бинад
export function selfStudentOr(...allowedRoles: RoleName[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role as RoleName | undefined;
    if (role && allowedRoles.includes(role)) return next();
    if (role === "student" && req.user?.student_id === Number(req.params.id)) return next();
    return res.status(403).json({ message: "Дастрасӣ манъ аст" });
  };
}

// Эзоҳ: requireCanAddStudents ва User.can_add_students нест карда шуданд.
// Он танзим танҳо барои mentor маънӣ дошт, вале mentor акнун умуман донишҷӯ
// илова карда наметавонад — POST /students ба superadmin/director маҳдуд аст.
