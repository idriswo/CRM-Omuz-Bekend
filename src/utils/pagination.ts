const MAX_LIMIT = 200;

export function getPagination(query: any) {
  const page = Math.max(1, parseInt(query.page) || 1);
  // Бе ҳадди боло ?limit=999999 тамоми ҷадвалро ба хотира мекашид
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  const sort_by = query.sort_by || "id";
  const sort_dir: "asc" | "desc" = query.sort_dir === "asc" ? "asc" : "desc";
  return { page, limit, skip, sort_by, sort_dir };
}

export function buildEnvelope(data: any[], total: number, page: number, limit: number) {
  return { data, meta: { total, page, limit } };
}

/**
 * orderBy-и бехатар: sort_by рост аз query меояд, бинобар ин бе рӯйхати сафед
 * ?sort_by=xyz ба Prisma мерасид ва 500 медод. Ҳар номи ношинос ба "id" бармегардад.
 */
export function buildOrderBy(sort_by: unknown, sort_dir: "asc" | "desc", allowed: readonly string[]) {
  const field = allowed.includes(String(sort_by)) ? String(sort_by) : "id";
  return { [field]: sort_dir };
}

