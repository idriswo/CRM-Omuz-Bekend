import { Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope, buildOrderBy } from "../../utils/pagination";
import { AuthRequest } from "../../middlewares/auth.middleware";

const SORTABLE = ["id", "title", "read", "created_at"] as const;

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const where = { user_id: req.user!.id };

  const [data, total, unread_count] = await Promise.all([
    prisma.notification.findMany({ where, skip, take: limit, orderBy: buildOrderBy(sort_by, sort_dir, SORTABLE) }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, read: false } }),
  ]);

  res.json({ ...buildEnvelope(data, total, page, limit), unread_count });
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  const notification = await prisma.notification.update({
    where: { id: Number(req.params.id) },
    data: { read: true },
  });
  res.json(notification);
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({ where: { user_id: req.user!.id, read: false }, data: { read: true } });
  res.json({ success: true });
};
