import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getPagination, buildEnvelope, buildOrderBy } from "../../utils/pagination";

const SORTABLE = ["id", "action", "entity", "date"] as const;

export const getLogs = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const { user_id, entity, action } = req.query;

  const where: any = {};
  if (user_id) where.user_id = Number(user_id);
  if (entity) where.entity = entity;
  if (action) where.action = action;

  const [data, total] = await Promise.all([
    prisma.log.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy(sort_by, sort_dir, SORTABLE),
      include: { user: { select: { id: true, full_name: true, phone: true } } },
    }),
    prisma.log.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};
