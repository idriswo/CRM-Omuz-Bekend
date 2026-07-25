/**
 * Табдили қиммати хом аз req.body/req.query ба типи дурусти Prisma.
 *
 * Сабаб: клиент рақамҳоро аксаран ҳамчун сатр мефиристад ("1500") ва санаро
 * ҳамчун матни дилхоҳ. Агар инҳо рост ба Prisma раванд, ҷавоб 500 мешавад,
 * дар ҳоле ки хато аз тарафи клиент аст ва бояд 400 бошад.
 *
 * Ҳамаи функсияҳо барои қиммати нодуруст `undefined` медиҳанд — яъне Prisma
 * майдонро тамоман сарфи назар мекунад (барои update-и қисман маҳз ҳамин лозим).
 */

/** id-и бутуни мусбат. */
export function toId(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/** Адади бутун; 0 қиммати дуруст аст (масалан paid=0, discount=0). */
export function toInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

/** Сана; барои "салом" ё "2026-13-45" undefined медиҳад, на Invalid Date. */
export function toDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const d = new Date(value as any);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
