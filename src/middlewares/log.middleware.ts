import { Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { AuthRequest } from "./auth.middleware";

export function logAction(entity: string, action: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    res.on("finish", async () => {
      if (res.statusCode < 400 && req.user?.id) {
        await prisma.log.create({ data: { user_id: req.user.id, action, entity } });
      }
    });
    next();
  };
}
