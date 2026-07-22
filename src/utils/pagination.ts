export function getPagination(query: any) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, parseInt(query.limit) || 20);
  const skip = (page - 1) * limit;
  const sort_by = query.sort_by || "id";
  const sort_dir: "asc" | "desc" = query.sort_dir === "asc" ? "asc" : "desc";
  return { page, limit, skip, sort_by, sort_dir };
}

export function buildEnvelope(data: any[], total: number, page: number, limit: number) {
  return { data, meta: { total, page, limit } };
}
