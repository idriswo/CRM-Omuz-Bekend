/**
 * Нақши "admin" ба "mentor" ном иваз мешавад (2026-07-27).
 *
 * Танҳо номи сатри Role иваз мешавад — id, ҳуқуқҳо ва корбароне, ки ба он
 * пайвастанд, бетағйир мемонанд. Яъне ҳеҷ кас дастрасиашро гум намекунад.
 *
 * Иҷро:
 *   npx ts-node prisma/rename-admin-role.ts            # танҳо нишон медиҳад
 *   npx ts-node prisma/rename-admin-role.ts --apply    # воқеан менависад
 *
 * Скрипт idempotent аст — такрори иҷро зарар надорад.
 */
import { PrismaClient } from "@prisma/client";
import { ROLES } from "../src/constants/roles";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const OLD_NAME = "admin";

async function main() {
  console.log(APPLY ? "=== РЕЖИМИ НАВИШТАН ===\n" : "=== РЕЖИМИ НИШОНДОД (--apply нест) ===\n");

  const oldRole = await prisma.role.findFirst({ where: { name: OLD_NAME } });
  const newRole = await prisma.role.findFirst({ where: { name: ROLES.MENTOR } });

  if (!oldRole) {
    console.log(
      newRole
        ? `Нақши "${ROLES.MENTOR}" аллакай мавҷуд аст (id=${newRole.id}) — коре лозим нест.`
        : `Нақши "${OLD_NAME}" ёфт нашуд ва "${ROLES.MENTOR}" низ нест. Аввал seed-ро иҷро кунед.`
    );
    return;
  }

  // Ҳарду вуҷуд доранд — ин ҳолати нохост аст ва дастӣ ҳал талаб мекунад,
  // вагарна корбарони як нақш бе дастрасӣ мемонанд.
  if (newRole) {
    const oldCount = await prisma.user.count({ where: { role_id: oldRole.id } });
    const newCount = await prisma.user.count({ where: { role_id: newRole.id } });
    console.log(`⛔ Ҳам "${OLD_NAME}" (id=${oldRole.id}, ${oldCount} корбар), ҳам`);
    console.log(`   "${ROLES.MENTOR}" (id=${newRole.id}, ${newCount} корбар) мавҷуданд.`);
    console.log(`   Кадомашро нигоҳ доштан — қарори шумост. Скрипт коре намекунад.`);
    return;
  }

  const userCount = await prisma.user.count({ where: { role_id: oldRole.id } });
  const permCount = await prisma.permission.count({ where: { role_id: oldRole.id } });

  console.log(`Нақши "${OLD_NAME}" (id=${oldRole.id}) -> "${ROLES.MENTOR}"`);
  console.log(`  корбарони пайваст: ${userCount}`);
  console.log(`  ҳуқуқҳои пайваст:  ${permCount}`);
  console.log(`  id бетағйир мемонад — ҳеҷ кас дастрасиашро гум намекунад`);

  if (APPLY) {
    await prisma.role.update({ where: { id: oldRole.id }, data: { name: ROLES.MENTOR } });
    console.log(`\n✅ Ном иваз шуд.`);
  } else {
    console.log(`\nБарои навиштан: npx ts-node prisma/rename-admin-role.ts --apply`);
  }
}

main()
  .catch((e) => {
    console.error("ХАТО:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
