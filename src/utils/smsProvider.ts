/**
 * Фиристодани SMS.
 *
 * Ҳоло stub аст — танҳо ба лог менависад, ҳеҷ SMS воқеан намеравад.
 * Вақте Osonsms (ё провайдери дигар) пайваст мешавад, ТАНҲО функсияи
 * `sendViaProvider` дар поён навишта мешавад; ҳамаи ҷойҳои дигари барнома
 * бетағйир мемонанд.
 *
 * Тағйирёбандаҳои .env, ки он вақт лозим мешаванд:
 *   SMS_PROVIDER_URL   — endpoint-и провайдер
 *   SMS_LOGIN          — логин/идентификатор
 *   SMS_PASSWORD_HASH  — калид/пароли API
 *   SMS_SENDER         — alfa-name-и бақайдгирифта (масалан "OMUZ")
 *
 * Агар SMS_PROVIDER_URL холӣ бошад, барнома дар режими stub кор мекунад —
 * яъне dev ва тест бе ҳисоби воқеии SMS кор мекунанд.
 */

export const smsEnabled = () => Boolean(process.env.SMS_PROVIDER_URL);

/**
 * Ягона ҷое, ки ҳангоми пайвасти провайдер иваз мешавад.
 * Ҳангоми нарасидани паём бояд хато партояд — sendSms аз рӯи он
 * failed_count-ро мешуморад ва дигар рақамҳоро бекор намекунад.
 */
async function sendViaProvider(_phone: string, _message: string): Promise<void> {
  // TODO: дархости воқеӣ ба Osonsms — шакли дақиқ аз ҳуҷҷати онҳо гирифта мешавад.
  throw new Error("Провайдери SMS ҳанӯз пайваст нашудааст (SMS_PROVIDER_URL холӣ аст)");
}

export const smsProvider = {
  /** @param phone дар шакли 992XXXXXXXXX — utils/phone инро таъмин мекунад */
  async send(phone: string, message: string): Promise<void> {
    if (!smsEnabled()) {
      console.log(`[SMS stub] -> ${phone}: ${message}`);
      return;
    }
    await sendViaProvider(phone, message);
  },
};

/** Паёми credential барои ҳисоби нав. */
export function credentialsMessage(params: { full_name?: string | null; phone: string; password: string }) {
  const who = params.full_name ? `${params.full_name}, ` : "";
  return (
    `${who}ба системаи Omuz CRM ҳисоби шумо кушода шуд.\n` +
    `Логин: ${params.phone}\n` +
    `Парол: ${params.password}\n` +
    `Пас аз аввалин ворид шудан паролро иваз кунед.`
  );
}
