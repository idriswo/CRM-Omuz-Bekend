import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { RoleName } from "../constants/roles";
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

// Танҳо барои POST /students: admin бояд can_add_students=true дошта бошад (superadmin/director ҳамеша иҷозат доранд)
export async function requireCanAddStudents(req: AuthRequest, res: Response, next: NextFunction) {
  const role = req.user?.role as RoleName | undefined;
  if (role === "superadmin" || role === "director") return next();
  if (role !== "admin") return res.status(403).json({ message: "Дастрасӣ манъ аст" });

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.can_add_students) {
    return res.status(403).json({ message: "Шумо иҷозати илова кардани донишҷӯро надоред" });
  }
  next();
}
