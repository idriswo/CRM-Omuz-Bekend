/**
 * Скрипти якдафъаина: аз Google `refresh_token` мегирад, то барнома тавонад
 * тавассути Gmail API email фиристад.
 *
 * Иҷро:
 *   npx ts-node scripts/gmail-oauth.ts
 *
 * Пеш аз он дар .env бояд бошанд:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *
 * Онҳо аз Google Cloud Console гирифта мешаванд:
 *   Google Auth Platform → Clients → Create client → Application type: Desktop app
 *
 * Натиҷа — як сатри GOOGLE_REFRESH_TOKEN, ки ба .env ва ба Render гузошта мешавад.
 * Токен бемуҳлат аст: як бор гирифта мешавад ва боз лозим намешавад.
 */
import "dotenv/config";
import http from "http";
import { AddressInfo } from "net";
import { google } from "googleapis";

// Google усули кӯҳнаи "urn:ietf:wg:oauth:2.0:oob"-ро аз соли 2022 манъ кардааст.
// Барои Desktop app роҳи дурусти боқимонда — loopback: браузер кодро ба
// сервери муваққатии маҳаллӣ бармегардонад. Порт ихтиёрӣ аст — Google барои
// Desktop app ҳар порти localhost-ро қабул мекунад.
const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

const page = (title: string, body: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head>
   <body style="font-family:system-ui,sans-serif;text-align:center;padding:60px;">
     <h2>${title}</h2><p>${body}</p></body></html>`;

async function main() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error(
      "ХАТО: GOOGLE_CLIENT_ID ва GOOGLE_CLIENT_SECRET дар .env нестанд.\n" +
        "Онҳоро аз Google Auth Platform → Clients гиред."
    );
    process.exit(1);
  }

  // Аввал сервер бардошта мешавад, то порти воқеиро донем — он ба redirect_uri меравад
  const server = http.createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;
  const redirectUri = `http://localhost:${port}`;

  const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);

  const codePromise = new Promise<string>((resolve, reject) => {
    server.on("request", (req, res) => {
      const url = new URL(req.url || "/", redirectUri);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      if (code) {
        res.end(page("Тайёр ✅", "Ин тирезаро пӯшед ва ба терминал баргардед."));
        resolve(code);
      } else {
        res.end(page("Хато", error || "Код наомад."));
        reject(new Error(error || "код наомад"));
      }
    });
  });

  const url = oauth2.generateAuthUrl({
    // "offline" — маҳз ҳамин refresh_token медиҳад, бе он танҳо access token меояд
    access_type: "offline",
    scope: SCOPES,
    // Google refresh_token-ро танҳо ҳангоми РОЗИГИИ НАВ мефиристад. Агар қаблан
    // иҷозат дода бошед, бе ин майдон ҷавоб холӣ меомад.
    prompt: "consent",
  });

  console.log("\nИн пайвандро дар браузер кушоед:\n");
  console.log(url);
  console.log("\n• Бо ҳисоби Gmail-е ворид шавед, ки паём аз номи он меравад.");
  console.log('• Агар огоҳии "Google hasn\'t verified this app" барояд:');
  console.log('  Advanced → "Go to Omuz CRM (unsafe)" — ин лоиҳаи худи шумост.');
  console.log("\nМунтазири ҷавоб аз браузер...\n");

  const code = await codePromise;
  server.close();

  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      "\nХАТО: refresh_token наомад. Одатан сабаб ин аст, ки ба ин барнома\n" +
        "аллакай иҷозат дода будед. Дар https://myaccount.google.com/permissions\n" +
        "дастрасии онро бекор кунед ва скриптро аз нав иҷро кунед."
    );
    process.exit(1);
  }

  console.log("✅ Тайёр. Ин сатрро ба .env ва ба Render → Environment гузоред:\n");
  console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
  console.log("\n⚠️ Ин токен мисли парол махфӣ аст — дар чат ё repo нагузоред.\n");
}

main().catch((err) => {
  console.error("\nХАТО:", err?.response?.data || err?.message || err);
  process.exit(1);
});
