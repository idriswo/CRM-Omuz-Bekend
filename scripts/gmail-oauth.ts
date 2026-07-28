/**
 * Скрипти якдафъаина: аз Google `refresh_token` мегирад, то barnoma тавонад
 * тавассути Gmail API email фиристад.
 *
 * Иҷро:
 *   npx ts-node scripts/gmail-oauth.ts
 *
 * Пеш аз он дар .env бояд бошанд:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *
 * Онҳо аз Google Cloud Console гирифта мешаванд:
 *   APIs & Services → Credentials → Create credentials → OAuth client ID
 *   → Application type: Desktop app
 *
 * Натиҷа — як сатри GOOGLE_REFRESH_TOKEN, ки ба .env ва ба Render гузошта мешавад.
 * Токен бемуҳлат аст: як бор гирифта мешавад ва боз лозим намешавад.
 */
import "dotenv/config";
import readline from "readline";
import { google } from "googleapis";

// "Out-of-band" — барои Desktop app, то браузер ба сервери маҳаллӣ ниёз надошта бошад
const REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";

// Танҳо ҳуқуқи фиристодан. gmail.send хондани почтаро ИҶОЗАТ НАМЕДИҲАД —
// ҳадди ақали лозимӣ, то калид дар сурати дуздида шудан камтар хатар дошта бошад.
const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

async function main() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error(
      "ХАТО: GOOGLE_CLIENT_ID ва GOOGLE_CLIENT_SECRET дар .env нестанд.\n" +
        "Онҳоро аз Google Cloud Console → APIs & Services → Credentials гиред."
    );
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);

  const url = oauth2.generateAuthUrl({
    // "offline" — маҳз ҳамин refresh_token медиҳад, бе он танҳо access token меояд
    access_type: "offline",
    scope: SCOPES,
    // Google refresh_token-ро танҳо ҳангоми РОЗИГИИ НАВ мефиристад. Агар қаблан
    // иҷозат дода бошед, бе ин майдон ҷавоб холӣ меомад.
    prompt: "consent",
  });

  console.log("\n1. Ин пайвандро дар браузер кушоед:\n");
  console.log(url);
  console.log("\n2. Бо ҳисоби Gmail-е ворид шавед, ки паём аз номи он меравад.");
  console.log('3. Агар огоҳии "Google hasn\'t verified this app" барояд:');
  console.log('   Advanced → "Go to ... (unsafe)" — ин лоиҳаи худи шумост, бехатар аст.');
  console.log("4. Кодро нусха кунед ва ин ҷо гузоред.\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise<string>((resolve) =>
    rl.question("Код: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );

  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      "\nХАТО: refresh_token наомад. Одатан сабаб ин аст, ки ба ин барнома\n" +
        "аллакай иҷозат дода будед. Дар https://myaccount.google.com/permissions\n" +
        "дастрасии онро бекор кунед ва скриптро аз нав иҷро кунед."
    );
    process.exit(1);
  }

  console.log("\n✅ Тайёр. Ин сатрро ба .env ва ба Render → Environment гузоред:\n");
  console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
  console.log("\n⚠️ Ин токен мисли парол махфӣ аст — дар чат ё repo нагузоред.\n");
}

main().catch((err) => {
  console.error("\nХАТО:", err?.response?.data || err?.message || err);
  process.exit(1);
});
