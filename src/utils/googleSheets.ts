import { google } from "googleapis";
import { prisma } from "./prisma";

/**
 * Синхронизатсияи журнали гурӯҳ бо Google Sheets.
 *
 * Барои кор кардан ду чиз лозим аст:
 *  1) GOOGLE_SERVICE_ACCOUNT_JSON — калиди service account (тамоми JSON дар як сатр)
 *  2) ҳуҷҷати Google Sheets бо email-и ҳамон service account ҳамчун Editor мубодила шуда бошад
 *
 * Агар калид гузошта нашуда бошад, ҳамаи функсияҳо бе хато бекор мешаванд —
 * яъне журнал бе Google Sheets ҳам мисли пештара кор мекунад.
 */

export const sheetsEnabled = () => Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

function getClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

/** Аз линки муқаррарии Google Sheets id-и ҳуҷҷатро мегирад. */
export function extractSheetId(url?: string | null): string | null {
  if (!url) return null;
  const m = String(url).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}

const fmtDate = (d: Date) =>
  `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${String(
    d.getUTCFullYear()
  ).slice(2)}`;

/** Тамоми журнали гурӯҳро ба ҷадвали ҳамвор (rows) табдил медиҳад. */
async function buildRows(groupId: number) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      students: { where: { status: { not: "inactive" } } },
      weeks: { include: { entries: true }, orderBy: { week_number: "asc" } },
    },
  });
  if (!group) return null;

  const rows: (string | number)[][] = [];
  rows.push([`Журнали гурӯҳи «${group.name}»`]);
  rows.push([`Навсозӣ: ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`]);
  rows.push([]);

  for (const week of group.weeks) {
    const dates = [...week.dates].sort((a, b) => a.getTime() - b.getTime());
    rows.push([`Ҳафтаи ${week.week_number}`]);
    rows.push(["Донишҷӯ", ...dates.map(fmtDate), "Bonus", "Exam", "Сумма"]);

    for (const student of group.students) {
      const mine = week.entries.filter((e) => e.student_id === student.id);
      const cells = dates.map((d) => {
        const entry = mine.find((e) => e.day_date.getTime() === d.getTime());
        if (!entry) return "";
        // "95" = ҳозир бо бал, "н" = ҳозир набуд
        return entry.attendance ? String(entry.score ?? "+") : "н";
      });
      const bonus = mine.find((e) => e.bonus != null)?.bonus ?? 0;
      const exam = mine.find((e) => e.exam != null)?.exam ?? 0;
      const scoreSum = mine.reduce((acc, e) => acc + (e.score ?? 0), 0);

      rows.push([
        `${student.last_name} ${student.first_name}`,
        ...cells,
        bonus,
        exam,
        scoreSum + bonus + exam,
      ]);
    }
    rows.push([]);
  }

  return rows;
}

/**
 * Журналро аз нав ба ҳуҷҷати Google менависад.
 * Пас аз ҳар тағйирот (ҳафтаи нав, санаи нав, таҳрири катак, нест кардан) даъват мешавад.
 */
export async function syncJournalToSheet(groupId: number) {
  const sheets = getClient();
  if (!sheets) return { skipped: "GOOGLE_SERVICE_ACCOUNT_JSON гузошта нашудааст" };

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { sheet_id: true, sheet_url: true },
  });
  const spreadsheetId = group?.sheet_id ?? extractSheetId(group?.sheet_url);
  if (!spreadsheetId) return { skipped: "Ин гурӯҳ линки Google Sheets надорад" };

  const rows = await buildRows(groupId);
  if (!rows) return { skipped: "Гурӯҳ ёфт нашуд" };

  // Аввал варақ тоза, баъд аз нав пур карда мешавад — то сатрҳои кӯҳна намонанд
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: "A1:ZZ10000" });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "A1",
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });

  return { synced: true, rows: rows.length };
}

// Синхронизатсияҳо набояд ҳамзамон раванд: ҳар яке аввал варақро тоза мекунад,
// бинобар ин навиштани кӯҳна метавонад навро пахш кунад. Барои ҳар гурӯҳ як навбат.
const queues = new Map<number, Promise<unknown>>();
const pending = new Set<number>();

const WRITE_DELAY_MS = 800; // таҳрирҳои паиҳам ба як навиштан ҷамъ мешаванд

/** Даъвати бехатар: хатои Google набояд худи амали журналро вайрон кунад. */
export function syncJournalSafe(groupId: number) {
  if (pending.has(groupId)) return; // аллакай дар навбат аст — маълумоти нав ҳам ҳамон ҷо меафтад
  pending.add(groupId);

  const next = (queues.get(groupId) ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      await new Promise((r) => setTimeout(r, WRITE_DELAY_MS));
      pending.delete(groupId); // аз ин лаҳза таҳрири нав навбати навро мехоҳад
      return syncJournalToSheet(groupId);
    })
    .catch((err) => {
      pending.delete(groupId);
      console.error(`[google-sheets] синхронизатсия нашуд (гурӯҳи ${groupId}):`, err.message);
    });

  queues.set(groupId, next);
}
