import crypto from "crypto";

/**
 * Пароли муваққатӣ барои ҳисоби нав, ки бо email фиристода мешавад.
 *
 * Алифбо қасдан аломатҳои шабеҳро надорад (0/O, 1/l/I) — корбар паролро аз
 * экрани телефон хонда, дастӣ менависад ва "O" ё "0" будани онро фарқ карда
 * наметавонад.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const LENGTH = 10;

export function generateTempPassword(): string {
  // crypto.randomInt, на Math.random — парол набояд пешбинишаванда бошад
  let out = "";
  for (let i = 0; i < LENGTH; i++) {
    out += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return out;
}
