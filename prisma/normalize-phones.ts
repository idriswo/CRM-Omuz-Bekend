/**
 * Рақамҳои телефони мавҷударо ба шакли ягонаи `992XXXXXXXXX` меорад.
 *
 * Пеш аз ин рақам ҳамчун матни озод сабт мешуд, бинобар ин дар база
 * "902223344", "+992 90 222 33 44", "90-222-33-44" ва матни бемаънӣ якҷо буданд.
 *
 * Иҷро:
 *   npx ts-node prisma/normalize-phones.ts            # танҳо нишон медиҳад
 *   npx ts-node prisma/normalize-phones.ts --apply    # воқеан менависад
 *
 * Бе --apply ҳеҷ чиз тағйир намеёбад — аввал ҳисоботро бинед.
 */
import { PrismaClient } from "@prisma/client";
import { normalizePhone, normalizePhoneList } from "../src/utils/phone";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

interface Problem {
  table: string;
  id: number;
  field: string;
  value: string;
  reason: string;
}

const problems: Problem[] = [];
let changed = 0;
let alreadyOk = 0;

function plan(table: string, id: number, field: string, raw: string | null) {
  if (!raw) return undefined;
  const norm = normalizePhone(raw);
  if (!norm) {
    problems.push({ table, id, field, value: raw, reason: "нормализа намешавад" });
    return undefined;
  }
  if (norm === raw) {
    alreadyOk++;
    return undefined;
  }
  changed++;
  console.log(`  ${table}#${id}.${field}: "${raw}" -> "${norm}"`);
  return norm;
}

async function main() {
  console.log(APPLY ? "=== РЕЖИМИ НАВИШТАН ===\n" : "=== РЕЖИМИ НИШОНДОД (--apply нест) ===\n");

  // ---- User: phone логин ва @unique аст — бархӯрдҳо бояд пеш аз навиштан пайдо шаванд
  console.log("[User]");
  const users = await prisma.user.findMany({ select: { id: true, phone: true } });
  const targets = new Map<string, number[]>();
  for (const u of users) {
    const norm = normalizePhone(u.phone);
    if (!norm) {
      problems.push({ table: "User", id: u.id, field: "phone", value: u.phone, reason: "нормализа намешавад — ин ЛОГИН аст" });
      continue;
    }
    targets.set(norm, [...(targets.get(norm) ?? []), u.id]);
  }
  const collisions = [...targets.entries()].filter(([, ids]) => ids.length > 1);
  if (collisions.length) {
    console.log("\n  ⛔ БАРХӮРД: якчанд корбар пас аз нормализатсия як рақам мегиранд.");
    for (const [phone, ids] of collisions) console.log(`     ${phone} <- User id: ${ids.join(", ")}`);
    console.log("     phone дар User @unique аст — навиштан ноком мешавад.");
    console.log("     Аввал инҳоро дастӣ ҳал кунед, баъд скриптро такрор кунед.\n");
    if (APPLY) {
      console.log("НАВИШТАН БЕКОР КАРДА ШУД.");
      return;
    }
  }
  for (const u of users) {
    const norm = plan("User", u.id, "phone", u.phone);
    if (norm && APPLY) await prisma.user.update({ where: { id: u.id }, data: { phone: norm } });
  }

  // ---- Student: phone, father_phone, phones[]
  console.log("\n[Student]");
  const students = await prisma.student.findMany({
    select: { id: true, phone: true, father_phone: true, phones: true },
  });
  for (const s of students) {
    const phone = plan("Student", s.id, "phone", s.phone);
    const father = plan("Student", s.id, "father_phone", s.father_phone);
    const list = normalizePhoneList(s.phones);
    const listChanged = list !== undefined && JSON.stringify(list) !== JSON.stringify(s.phones);
    if (listChanged) {
      changed++;
      console.log(`  Student#${s.id}.phones: ${JSON.stringify(s.phones)} -> ${JSON.stringify(list)}`);
    }
    if (APPLY && (phone || father || listChanged)) {
      await prisma.student.update({
        where: { id: s.id },
        data: {
          ...(phone ? { phone } : {}),
          ...(father ? { father_phone: father } : {}),
          ...(listChanged ? { phones: list } : {}),
        },
      });
    }
  }

  // ---- Employee
  console.log("\n[Employee]");
  const employees = await prisma.employee.findMany({ select: { id: true, phone: true } });
  for (const e of employees) {
    const norm = plan("Employee", e.id, "phone", e.phone);
    if (norm && APPLY) await prisma.employee.update({ where: { id: e.id }, data: { phone: norm } });
  }

  // ---- Lead
  console.log("\n[Lead]");
  const leads = await prisma.lead.findMany({ select: { id: true, phone: true } });
  for (const l of leads) {
    const norm = plan("Lead", l.id, "phone", l.phone);
    if (norm && APPLY) await prisma.lead.update({ where: { id: l.id }, data: { phone: norm } });
  }

  // ---- Ҳисобот
  console.log(`\n${"=".repeat(64)}`);
  console.log(`Аллакай дуруст: ${alreadyOk}`);
  console.log(`${APPLY ? "Иваз шуд" : "Иваз мешавад"}: ${changed}`);
  console.log(`Мушкил: ${problems.length}`);

  if (problems.length) {
    console.log(`\nИн рақамҳо нормализа намешаванд ва ДАСТӢ ислоҳ талаб мекунанд:`);
    for (const p of problems) {
      console.log(`  ${p.table}#${p.id}.${p.field} = "${p.value}"  (${p.reason})`);
    }
    console.log(`\nОнҳо бетағйир монданд — SMS ба ин рақамҳо намеравад.`);
  }
  if (!APPLY && (changed || problems.length)) {
    console.log(`\nБарои навиштан: npx ts-node prisma/normalize-phones.ts --apply`);
  }
}

main()
  .catch((e) => {
    console.error("ХАТО:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
