/**
 * Рақами телефон ба як шакли ягона: `992XXXXXXXXX` (12 рақам, бе + ва бе фосила).
 *
 * Сабаб: рақам ҳамчун матни озод сабт мешуд, бинобар ин дар база ҳамзамон
 * "902223344", "+992 90 222 33 44", "90-222-33-44" ва ҳатто "салом" меистод.
 * Рақам акнун логин нест — логин email аст. Вале барои алоқа (занг задан,
 * ҷустуҷӯ аз рӯи рақам) як шакли ягона лозим аст, вагарна ҷустуҷӯ ва
 * муқоиса кор намекунад.
 */

const COUNTRY_CODE = "992";
const NATIONAL_LENGTH = 9; // Тоҷикистон: +992 ва 9 рақам (мисол: 90 222 33 44)

/**
 * Эзоҳ: префикси оператор (90/91/92/93/98...) қасдан тафтиш карда намешавад.
 * Операторҳо префиксҳои нав мегиранд ва рӯйхати кӯҳнашуда рақами воқеиро
 * рад мекард — ин аз рақами нодуруст қабул кардан бадтар аст. Танҳо сохт
 * тафтиш мешавад: коди кишвар + 9 рақам.
 */
export function normalizePhone(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;

  let digits = String(value).replace(/\D/g, "");
  if (!digits) return undefined;

  // 00992... — префикси байналмилалӣ
  if (digits.startsWith("00" + COUNTRY_CODE)) digits = digits.slice(2);
  // 8992... ё 8 + рақами дохилӣ — префикси кӯҳнаи байнишаҳрӣ
  else if (digits.length === 1 + COUNTRY_CODE.length + NATIONAL_LENGTH && digits.startsWith("8")) {
    digits = digits.slice(1);
  } else if (digits.length === 1 + NATIONAL_LENGTH && digits.startsWith("8")) {
    digits = COUNTRY_CODE + digits.slice(1);
  }

  // Рақами дохилӣ бе коди кишвар
  if (digits.length === NATIONAL_LENGTH) digits = COUNTRY_CODE + digits;

  const valid = digits.length === COUNTRY_CODE.length + NATIONAL_LENGTH && digits.startsWith(COUNTRY_CODE);
  return valid ? digits : undefined;
}

export function isValidPhone(value: unknown): boolean {
  return normalizePhone(value) !== undefined;
}

/** Барои намоиш: "992902223344" -> "+992 90 222 33 44" */
export function formatPhone(value: unknown): string {
  const p = normalizePhone(value);
  if (!p) return typeof value === "string" ? value : "";
  const n = p.slice(COUNTRY_CODE.length);
  return `+${COUNTRY_CODE} ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7)}`;
}

/**
 * Массиви `phones` дар Student ҳамчун Json аст: [{ label, number }].
 * Ҳар number нормализа мешавад; сабтҳои нодуруст партофта мешаванд.
 */
export function normalizePhoneList(value: unknown): { label: string; number: string }[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value
    .map((entry) => {
      const number = normalizePhone(entry?.number ?? entry);
      if (!number) return null;
      return { label: String(entry?.label ?? "Phone"), number };
    })
    .filter((x): x is { label: string; number: string } => x !== null);
  return list;
}
