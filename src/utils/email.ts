/**
 * Нормализатсия ва тафтиши суроғаи email.
 *
 * email акнун логини вуруд аст, бинобар ин ҳамон мантиқе, ки барои рақами
 * телефон истифода шуд, ба он ҳам лозим: дар база як шакли ягона нигоҳ дошта
 * мешавад ва ҳангоми вуруд низ ҳамон нормализатсия татбиқ мегардад — вагарна
 * "Salim@Gmail.com" ва "salim@gmail.com" ду ҳисоби гуногун мешуданд.
 */

// Тафтиши амалӣ, на RFC-и пурра: як @, дар ҳар ду тараф матн, дар домен нуқта.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function normalizeEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 254) return undefined;
  return EMAIL_RE.test(trimmed) ? trimmed : undefined;
}

export function isValidEmail(value: unknown): boolean {
  return normalizeEmail(value) !== undefined;
}
