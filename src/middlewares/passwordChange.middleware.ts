import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

/**
 * Ҳисобҳое, ки паролашон аз тарафи система сохта ва бо email фиристода шудааст,
 * то ивази парол ба ҳеҷ бахши система дастрасӣ надоранд.
 *
 * Сабаб: он парол дар email рафтааст ва метавонад дар почта, дар лог ё дар
 * дасти каси дигар монад — бинобар ин ҳисоб то ивази он "нимкушода" аст.
 *
 * Худи ивази парол дар /api/auth/change-password аст, ки берун аз ин
 * миёнафзор насб шудааст — вагарна корбар дар доира меафтод.
 */
export function requirePasswordChanged(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.must_change_password) {
    return res.status(403).json({
      message: "Аввал паролро иваз кунед",
      must_change_password: true,
      change_password_endpoint: "POST /api/auth/change-password",
    });
  }
  next();
}
