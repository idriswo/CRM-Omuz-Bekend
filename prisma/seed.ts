import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { ROLES } from "../src/constants/roles";
import { normalizeEmail } from "../src/utils/email";

const prisma = new PrismaClient();

async function main() {
  const roleMap: Record<string, number> = {};
  for (const name of Object.values(ROLES)) {
    let role = await prisma.role.findFirst({ where: { name } });
    if (!role) role = await prisma.role.create({ data: { name } });
    roleMap[name] = role.id;
  }
  console.log("Роли: student, admin, superadmin, director — тайёр шуданд.");

  // Бутстрап: аввалин director, то касе тавонад аз /users дигар корбаронро идора кунад.
  // email логини вуруд аст ва ҳамон нормализатсияе мегузарад, ки login истифода
  // мебарад — вагарна "Director@Example.com" дар база менишаст ва вуруд бо
  // "director@example.com" ӯро намеёфт.
  const DIRECTOR_EMAIL = normalizeEmail(process.env.SEED_DIRECTOR_EMAIL || "director@example.com");
  const DIRECTOR_PASSWORD = process.env.SEED_DIRECTOR_PASSWORD || "Director@2026!";

  if (!DIRECTOR_EMAIL) {
    throw new Error(`SEED_DIRECTOR_EMAIL суроғаи дуруст нест: "${process.env.SEED_DIRECTOR_EMAIL}"`);
  }

  const existingDirector = await prisma.user.findUnique({ where: { email: DIRECTOR_EMAIL } });
  if (!existingDirector) {
    const hashed = await bcrypt.hash(DIRECTOR_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email: DIRECTOR_EMAIL,
        password: hashed,
        full_name: "Director",
        role_id: roleMap[ROLES.DIRECTOR],
      },
    });
    console.log(`Бутстрап-и director сохта шуд: email=${DIRECTOR_EMAIL} password=${DIRECTOR_PASSWORD}`);
    console.log("⚠️ Пас аз аввалин ворид шудан, ин паролро ҳатман иваз кунед!");
  } else {
    console.log("Director аллакай вуҷуд дорад — бутстрап нагузаронда шуд.");
  }

  // Демо-маълумот дида намешавад: дар база танҳо маълумоти воқеӣ мемонад.
  // Роль ва director — ин ягона чизест, ки система бе он кор намекунад.
}

main().finally(() => prisma.$disconnect());
