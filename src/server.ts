import "dotenv/config";
import app from "./app";
import { prisma } from "./utils/prisma";

const PORT = Number(process.env.PORT) || 4000;

const server = app.listen(PORT, () => {
  console.log(`Omuz CRM backend is running on port ${PORT}`);
});

// Хатогии худи listen (аксаран порт банд аст). Бе ин, хатогӣ ба uncaughtException
// мерафт ва раванд зинда мемонд — вале ба ҳеҷ порт гӯш намедод. Яъне сервери
// «зинда»-и мурда: health check ҷавоб намедиҳад, вале раванд намемирад.
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Порти ${PORT} аллакай банд аст. Раванди дигарро хомӯш кунед ё PORT-ро иваз кунед.`);
  } else {
    console.error("Хатогии сервер ҳангоми оғоз:", err);
  }
  process.exit(1);
});

/** Пӯшидани мураттаб: дархостҳои ҷорӣ анҷом меёбанд, баъд пайвасти база қатъ мешавад. */
const SHUTDOWN_TIMEOUT_MS = 10_000;
let shuttingDown = false;

async function shutdown(signal: string, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} қабул шуд — сервер пӯшида мешавад...`);

  // Агар пӯшидан дароз кашид (пайвасти овезон), маҷбуран мебарояд —
  // вагарна Render ҳангоми deploy раванди овезонро худаш мекушад.
  const force = setTimeout(() => {
    console.error("Пӯшидан дер кард — маҷбуран баромад");
    process.exit(exitCode || 1);
  }, SHUTDOWN_TIMEOUT_MS);
  force.unref();

  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch (err) {
      console.error("Хатогӣ ҳангоми қатъи пайванди база:", err);
    }
    console.log("Сервер пӯшида шуд.");
    process.exit(exitCode);
  });
}

// Render ҳангоми deploy/restart SIGTERM мефиристад, Ctrl+C — SIGINT
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Rejection-и бе catch: аксаран аз кори fire-and-forget меояд (масалан
// syncJournalSafe). Ин набояд тамоми API-ро хомӯш кунад — сабт мешавад ва бас.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

// uncaughtException бошад маънои дигар дорад: занҷири синхронӣ дар ҷои номаълум
// шикастааст ва ҳолати раванд эътимоднок нест. Пештар ин ҷо танҳо лог мешуд ва
// раванд кор мекард — яъне сервер метавонист бо ҳолати вайрон хизмат расонад.
// Дуруст: сабт кунем, мураттаб пӯшем ва бигузорем Render онро аз нав барорад.
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown("uncaughtException", 1);
});
