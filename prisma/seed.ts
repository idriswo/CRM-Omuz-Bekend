import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { ROLES } from "../src/constants/roles";

const prisma = new PrismaClient();

async function main() {
  const roleMap: Record<string, number> = {};
  for (const name of Object.values(ROLES)) {
    let role = await prisma.role.findFirst({ where: { name } });
    if (!role) role = await prisma.role.create({ data: { name } });
    roleMap[name] = role.id;
  }
  console.log("Роли: student, admin, superadmin, director — тайёр шуданд.");

  // Бутстрап: аввалин director, то касе тавонад аз /users дигар корбаронро идора кунад
  const DIRECTOR_PHONE = process.env.SEED_DIRECTOR_PHONE || "900000000";
  const DIRECTOR_PASSWORD = process.env.SEED_DIRECTOR_PASSWORD || "Director@2026!";

  const existingDirector = await prisma.user.findUnique({ where: { phone: DIRECTOR_PHONE } });
  if (!existingDirector) {
    const hashed = await bcrypt.hash(DIRECTOR_PASSWORD, 10);
    await prisma.user.create({
      data: {
        phone: DIRECTOR_PHONE,
        password: hashed,
        full_name: "Director",
        role_id: roleMap[ROLES.DIRECTOR],
      },
    });
    console.log(`Бутстрап-и director сохта шуд: phone=${DIRECTOR_PHONE} password=${DIRECTOR_PASSWORD}`);
    console.log("⚠️ Пас аз аввалин ворид шудан, ин паролро ҳатман иваз кунед!");
  } else {
    console.log("Director аллакай вуҷуд дорад — бутстрап нагузаронда шуд.");
  }
}

main().finally(() => prisma.$disconnect());
