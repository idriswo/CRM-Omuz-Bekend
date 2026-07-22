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

  await seedDemoData();
}

/**
 * Демо-маълумот барои саҳифаҳои Students/Groups.
 * Танҳо вақте иҷро мешавад, ки ягон донишҷӯ вуҷуд надошта бошад — маълумоти воқеиро вайрон намекунад.
 */
async function seedDemoData() {
  if ((await prisma.student.count()) > 0) {
    console.log("Демо-маълумот аллакай ҳаст — гузаронда шуд.");
    return;
  }

  const branchTitles = ["Omuz Ayni", "Omuz Sino"];
  const branches = [];
  for (const title of branchTitles) {
    const found = await prisma.branch.findFirst({ where: { title } });
    branches.push(
      found ??
        (await prisma.branch.create({
          data: { title, city: "Dushanbe", district: "Firdavsi", address: "Ayni street 46" },
        }))
    );
  }

  const courseDefs = [
    { name: "JavaScript", duration: "3 month", price: 900 },
    { name: "React", duration: "3 month", price: 1000 },
    { name: "C#", duration: "6 month", price: 1200 },
    { name: "C++", duration: "6 month", price: 1100 },
  ];
  const courses = [];
  for (const c of courseDefs) {
    const found = await prisma.course.findFirst({ where: { name: c.name } });
    courses.push(found ?? (await prisma.course.create({ data: c })));
  }

  const mentorDefs = [
    { first_name: "Shohin", last_name: "Rahimov", phone: "900000101" },
    { first_name: "Farrukh", last_name: "Qodirov", phone: "900000102" },
    { first_name: "Nilufar", last_name: "Saidova", phone: "900000103" },
  ];
  const mentors = [];
  for (const m of mentorDefs) {
    const found = await prisma.employee.findFirst({ where: { phone: m.phone } });
    mentors.push(
      found ?? (await prisma.employee.create({ data: { ...m, position: "Mentor", branch_id: branches[0].id } }))
    );
  }

  const tags = ["Advanced", "Kettle", "Handsome", "Black list", "ChatGPT"];
  const groupDefs = [
    { name: "JavaScript August", course: 0, status: "active" },
    { name: "React May", course: 1, status: "active" },
    { name: "C# 5 June", course: 2, status: "pending" },
    { name: "C++ June", course: 3, status: "active" },
    { name: "Olympiad 1", course: 0, status: "finished" },
  ];

  const groups = [];
  for (let i = 0; i < groupDefs.length; i++) {
    const g = groupDefs[i];
    const group = await prisma.group.create({
      data: {
        name: g.name,
        course_id: courses[g.course].id,
        branch_id: branches[i % branches.length].id,
        start_date: new Date(2025, i, 9),
        end_date: new Date(2026, i + 4, 10),
        duration: "3 month",
        duration_type: "month",
        required_students: 8 + i,
        capacity: 15,
        status: g.status,
        tag: tags[i % tags.length],
        format: i % 2 === 0 ? "offline" : "online",
        telegram_link: "https://t.me/omuz",
        mentors: { connect: [{ id: mentors[i % mentors.length].id }] },
        schedule_slots: {
          create: [
            { weekday: "Mn", start: "16:00", end: "18:00" },
            { weekday: "Wd", start: "16:00", end: "18:00" },
            { weekday: "Fr", start: "16:00", end: "18:00" },
          ],
        },
      },
    });
    groups.push(group);
  }

  const names = [
    ["Olimjon", "Tojiev"],
    ["Abdulsamad", "Ahmad"],
    ["Zabiri", "Alijon"],
    ["Qurbonali", "Nazarov"],
    ["Shamsuddinov", "Najibullo"],
    ["Dodarov", "Faridun"],
    ["Inoyatzoda", "Shodmon"],
    ["Karimov", "Dilovar"],
    ["Rajabova", "Mavzuna"],
    ["Sharipov", "Anvar"],
    ["Yusupova", "Sitora"],
    ["Nazarova", "Malika"],
  ];
  const reasons = ["Дар дарсҳо иштирок накард", "Компютераш вайрон шуд"];
  const gradTags = ["OpenToWork", "Work", "Freelancer", "Entrepreneur", "FurtherEducation"];
  const now = new Date();

  for (let i = 0; i < names.length; i++) {
    const [first_name, last_name] = names[i];
    const status = i % 7 === 3 ? "inactive" : i % 11 === 4 || i >= 10 ? "finished" : "active";
    const group = groups[i % groups.length];

    const student = await prisma.student.create({
      data: {
        first_name,
        last_name,
        birth_date: new Date(1999 + (i % 6), i % 12, 1 + (i % 27)),
        gender: i % 3 === 2 ? "female" : "male",
        address: "Dushanbe, Ayni street 46",
        email: `student${i + 1}@omuz.tj`,
        phone: `9325841${String(10 + i).padStart(2, "0")}`,
        father_phone: "934354943",
        phones: [
          { label: "Student", number: `9325841${String(10 + i).padStart(2, "0")}` },
          { label: "Father", number: "934354943" },
        ],
        telegram_username: "@omuz_student",
        is_top: i % 8 === 1,
        status,
        left_at: status === "inactive" ? new Date(now.getFullYear(), i % 12, 12) : null,
        left_reason: status === "inactive" ? reasons[i % reasons.length] : null,
        branch_id: branches[i % branches.length].id,
        coin_balance: 96 - i * 3,
        groups: { connect: { id: group.id } },
      },
    });

    // Шартномаҳо: як қисм фаъол, як қисм 10 рӯз мондааст, як қисм тамом шуда
    const endOffsetDays = i % 9 === 1 ? 7 : i % 13 === 4 ? -30 : 180;
    await prisma.contract.create({
      data: {
        student_id: student.id,
        start_date: new Date(now.getTime() - 90 * 24 * 3600 * 1000),
        end_date: new Date(now.getTime() + endOffsetDays * 24 * 3600 * 1000),
      },
    });

    if (status === "finished") {
      await prisma.graduateInfo.create({
        data: {
          student_id: student.id,
          work_place: i % 2 === 0 ? "Alif bank" : "Softclub",
          has_certificate: i % 3 !== 0,
          tag: gradTags[i % gradTags.length],
        },
      });
    }
  }

  console.log("Демо-маълумот сохта шуд: 2 филиал, 4 курс, 3 ментор, 5 гурӯҳ, 12 донишҷӯ.");
}

main().finally(() => prisma.$disconnect());
