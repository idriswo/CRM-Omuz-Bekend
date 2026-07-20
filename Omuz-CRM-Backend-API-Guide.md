# Omuz CRM — Дастури пурраи сохтани Backend API

Ин ҳуҷҷат тамоми endpoint-ҳои дар ҲТЗ (спецификатсия)-и шумо овардашударо дар бар мегирад ва мефаҳмонад, ки чӣ хел ҳар як гурӯҳро (модул) бо Node.js + Express + TypeScript + Prisma амалӣ созед.

---

## 0. Асосҳои умумӣ, ки барои ҲАМАИ endpoint-ҳо лозиманд

Пеш аз рафтан ба ҳар модул, се чизи такрорӣ ҳаст, ки шумо бояд як бор бисозед ва дар ҳама ҷо истифода баред:

### 0.1. Pagination + search — миёнафзор/утилита

```ts
// src/utils/pagination.ts
export function getPagination(query: any) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, parseInt(query.limit) || 20);
  const skip = (page - 1) * limit;
  const sort_by = query.sort_by || "id";
  const sort_dir = query.sort_dir === "asc" ? "asc" : "desc";
  return { page, limit, skip, sort_by, sort_dir };
}

export function buildEnvelope(data: any[], total: number, page: number, limit: number) {
  return { data, meta: { total, page, limit } };
}
```

Ҳар як `GET /list` endpoint ҳамин тавр менависед (мисол барои Students, дар поён айнан ҳамин намуна такрор мешавад — фақат `where` тағйир меёбад):

```ts
export const getStudents = async (req: Request, res: Response) => {
  const { page, limit, skip, sort_by, sort_dir } = getPagination(req.query);
  const { search, course_id, group_id, status } = req.query;

  const where: any = {};
  if (search) where.full_name = { contains: String(search), mode: "insensitive" };
  if (status) where.status = status;
  if (group_id) where.groups = { some: { id: Number(group_id) } };
  if (course_id) where.groups = { some: { course_id: Number(course_id) } };

  const [data, total] = await Promise.all([
    prisma.student.findMany({ where, skip, take: limit, orderBy: { [sort_by as string]: sort_dir } }),
    prisma.student.count({ where }),
  ]);

  res.json(buildEnvelope(data, total, page, limit));
};
```

Ҳамин **як шакл** барои ҳамаи 15+ рӯйхат (list) endpoint-ҳои спецификатсия истифода мешавад — фарқият фақат дар `where` ва модели Prisma аст.

### 0.2. Export (xlsx/csv) — як функсияи умумӣ

```ts
// src/utils/export.ts
import ExcelJS from "exceljs";
import { Response } from "express";

export async function exportToXlsx(res: Response, rows: any[], columns: { header: string; key: string }[], filename: string) {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Data");
  sheet.columns = columns;
  sheet.addRows(rows);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
}
```

Дар ҳар модуле, ки дар спека `export` навишта шудааст (Leads, Payments, Budget, Debtors), ҳамин функсияро даъват мекунед:
```ts
export const exportPayments = async (req, res) => {
  const rows = await prisma.payment.findMany({ /* ҳамон where-и list */ });
  await exportToXlsx(res, rows, [
    { header: "Full name", key: "full_name" },
    { header: "Amount", key: "amount" },
  ], "payments");
};
```

### 0.3. JWT Middleware (барои ҳамаи роутҳо ғайр аз `/auth/*`)

```ts
// src/middlewares/auth.middleware.ts
import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "No token" });
  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
```

Дар `app.ts`:
```ts
app.use("/api/auth", authRoutes);          // кушода
app.use("/api", authMiddleware, restRoutes); // ҳамаи боқимонда бо токен
```

Акнун ба ҳар модул мегузарем.

---

## 1. Auth (`/auth`)

Prisma model:
```prisma
model User {
  id           Int      @id @default(autoincrement())
  phone        String   @unique
  password     String
  full_name    String
  role_id      Int?
  branch_id    Int?
  created_at   DateTime @default(now())
}
```

| Route | Мантиқ |
|---|---|
| `POST /auth/register` | `bcrypt.hash(password)` → сабт кардани корбар |
| `POST /auth/login` | ёфтани корбар бо `phone` → `bcrypt.compare` → сохтани `access_token` (кӯтоҳмуддат, 15 мин) ва `refresh_token` (дарозмуддат, 7-30 рӯз) |
| `POST /auth/refresh-token` | тафтиш кардани `refresh_token` → баровардани `access_token`-и нав |
| `POST /auth/forgot-password` | фиристодани SMS-код (тавассути ҳамон сервиси SMS, ки дар боби 12 истифода мешавад) |
| `POST /auth/logout` | нест кардани refresh_token аз база (ё blacklist) |

```ts
export const login = async (req, res) => {
  const { phone, password } = req.body;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "Телефон ё парол хато" });

  const access_token = jwt.sign({ id: user.id, role: user.role_id }, process.env.JWT_SECRET!, { expiresIn: "15m" });
  const refresh_token = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "30d" });
  res.json({ access_token, refresh_token, user });
};
```

---

## 2. Dashboard (`/dashboard`)

Ин модул **аналитикӣ** аст — GET-ҳои сода бо `aggregate`/`groupBy` дар Prisma, на CRUD.

- `GET /dashboard/stats` → `prisma.student.count()`, `prisma.user.count()`, ва ғ., дар як `Promise.all`
- `GET /dashboard/attendance-log?date=` → аз ҷадвали `Attendance` бо `where: { date }`
- `GET /dashboard/groups-summary` → `groupBy` аз `Attendance` барои ҳисоб кардани absent/late/income дар ҳар гурӯҳ
- `GET /dashboard/leads-chart?year=` → `groupBy(['month'])` аз `Lead` бо филтри сол
- `GET /dashboard/attendance-chart?month=`, `GET /dashboard/income?month=`, `GET /dashboard/enroll-chart`, `GET /dashboard/employed-graduates`, `GET /dashboard/left-courses` — ҳамаашон ҳамин намуна: `groupBy` + `_count`/`_sum`

Мисол:
```ts
export const getDashboardStats = async (req, res) => {
  const [students_count, users_count, employees_count] = await Promise.all([
    prisma.student.count(),
    prisma.user.count(),
    prisma.employee.count(),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const [present, absent, late] = await Promise.all([
    prisma.attendance.count({ where: { date: today, status: "present" } }),
    prisma.attendance.count({ where: { date: today, status: "absent" } }),
    prisma.attendance.count({ where: { date: today, status: "late" } }),
  ]);
  res.json({ students_count, users_count, employees_count, present, absent, late });
};
```

⚠️ Маслиҳат: ин endpoint-ҳоро дар охир кунед — аввал CRUD-и Students/Groups/Payments-ро тайёр кунед, зеро Dashboard ба ин ҷадвалҳо такя мекунад.

---

## 3. Students (`/students`)

Prisma model:
```prisma
model Student {
  id           Int      @id @default(autoincrement())
  first_name   String
  last_name    String
  birth_date   DateTime
  gender       String
  address      String?
  email        String?
  phone        String
  father_phone String?
  photo        String?
  status       String   @default("active") // active|inactive|finished
  branch_id    Int?
  branch       Branch?  @relation(fields: [branch_id], references: [id])
  groups       Group[]  @relation("StudentGroups")
  contracts    Contract[]
}
```

- `GET /students` — намунаи 0.1, филтрҳо: `course_id` (тавассути `groups.course_id`), `group_id`, `contract_status` (аз ҷадвали алоҳидаи Contract ҳисоб мекунед: агар `end_date - today <= 10 рӯз` → `10_day_left`).
- `POST /students` — қабули `multipart/form-data` (барои `photo`) → истифодаи `multer` барои боркунии сурат.
- `GET /students/graduates` — филтр `where: { status: "finished" }` + `join` бо Certificate.
- `PUT /students/graduates/:id` — навсозии `work_place`, `has_certificate`, `tag` дар як ҷадвали алоҳида `GraduateInfo` (ё майдонҳои иловагӣ дар Student).
- `GET /students/graduates/stats` — `groupBy(['tag'])` дар байни хатмкунандагон.
- `POST /students/enroll` — агар `student_id` дода нашуда бошад, аввал `Student`-и нав месозад, баъд дар `GroupStudent` (jadval миёна) илова мекунад.

```ts
export const enrollStudent = async (req, res) => {
  const { student_id, group_id, new_student } = req.body;
  let studentId = student_id;
  if (!studentId && new_student) {
    const created = await prisma.student.create({ data: new_student });
    studentId = created.id;
  }
  await prisma.group.update({
    where: { id: group_id },
    data: { students: { connect: { id: studentId } } },
  });
  res.json({ success: true });
};
```

---

## 4. Groups (`/groups`)

Ин мураккабтарин модул аст, зеро **журнал (attendance/score)** дорад.

Prisma models:
```prisma
model Group {
  id                 Int      @id @default(autoincrement())
  name               String
  course_id          Int
  course             Course   @relation(fields: [course_id], references: [id])
  start_date         DateTime
  end_date           DateTime
  duration           String
  required_students  Int
  branch_id          Int
  status             String   @default("active")
  tag                String?  // Black list, Kettle, ...
  students           Student[] @relation("StudentGroups")
  weeks              JournalWeek[]
}

model JournalWeek {
  id         Int      @id @default(autoincrement())
  group_id   Int
  week_number Int
  dates      DateTime[]
  entries    JournalEntry[]
}

model JournalEntry {
  id            Int      @id @default(autoincrement())
  week_id       Int
  student_id    Int
  day_date      DateTime
  attendance    Boolean
  score         Int?
  bonus         Int?
  exam          Int?
}
```

- `GET /groups/:id/journal` — дар як дархост, `include`-и `weeks.entries`-ро мегиред, баъд дар сервер (ё дар query) ба шакли UI (`{ week_number, students: [...] }`) ҷамъбандӣ (aggregate) мекунед.
- `POST /groups/:id/journal/week` — сохтани сатри нав дар `JournalWeek` бо рӯйхати санаҳо.
- `PUT /groups/:id/journal/:weekId/students/:studentId` — `upsert` дар `JournalEntry` барои як рӯз (агар вуҷуд дошта бошад — навсозӣ, набошад — сохтан):
```ts
await prisma.journalEntry.upsert({
  where: { week_id_student_id_day_date: { week_id: weekId, student_id: studentId, day_date } },
  update: { attendance, score, bonus, exam },
  create: { week_id: weekId, student_id: studentId, day_date, attendance, score, bonus, exam },
});
```
(Барои ин, дар Prisma schema `@@unique([week_id, student_id, day_date])` илова кунед.)

- `GET /groups/stats` — `groupBy(['tag'])` барои ҳисоб кардани миқдор дар ҳар тег.

---

## 5. Employees / Mentors (`/employees`)

CRUD-и оддӣ, айнан монанди Students (боби 3), фақат бе `groups`, бо иловаи:
```prisma
model Employee {
  id          Int    @id @default(autoincrement())
  first_name  String
  last_name   String
  position    String
  experience  Int?
  branch_id   Int?
  phone       String
  email       String?
}

model MentorLevel {
  id           Int    @id @default(autoincrement())
  employee_id  Int
  level        String
}
```
`GET /employees/mentor-levels` ва `PUT /employees/mentor-levels/:id` — CRUD-и алоҳидаи сатҳи менторҳо.

---

## 6. Courses & Leads (`/courses`, `/leads`)

```prisma
model Course {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  duration    String
  price       Int
  resources   Resource[]
  groups      Group[]
}

model Lead {
  id           Int      @id @default(autoincrement())
  full_name    String
  phone        String
  lesson_time  String?
  course_id    Int?
  utm_source   String?
  occupation   String?
  notes        String?
  type         String   @default("Lead") // Lead|Client
  created_at   DateTime @default(now())
}
```

- `POST /leads/:id/convert-to-client` — танҳо навсозии `type: "Client"` мекунад (ва эҳтимол сохтани Student).
- `POST /leads/transfer` — `updateMany({ where: { id: { in: lead_ids } }, data: { course_id: target_course_id } })`
- `GET /leads/coupons`, `POST /leads/coupons` — ҷадвали алоҳидаи `Coupon` бо коди тахфиф барои лид.

---

## 7. Timetable (`/timetable`)

```prisma
model TimetableEntry {
  id          Int      @id @default(autoincrement())
  course_name String
  group_id    Int?
  type        String   // Lecture
  start_time  DateTime
  end_time    DateTime
  class_room  String
  mentor_id   Int
  date        DateTime
  repeat_days Int[]    // 0=Якшанбе...6=Шанбе, барои такрори ҳафтагӣ
}
```

- `view=day|week|month` — дар Query, шумо диапазони санаро ҳисоб мекунед (масалан бо `date-fns`: `startOfWeek`/`endOfWeek`) ва `where: { date: { gte, lte } }` мегузоред.
- Агар `repeat_days` дошта бошад — ҳангоми `GET`, барои ҳар рӯз дар диапазон, санаҳои такрориро дар JS generate мекунед (на дар база нигоҳ медоред, то дарозии рӯйхат хурд монад).

---

## 8. Administration (`/users`, `/permissions`, `/roles`, `/logs`)

```prisma
model Role {
  id          Int    @id @default(autoincrement())
  name        String
  permissions Permission[]
}

model Permission {
  id       Int     @id @default(autoincrement())
  name     String
  group    String  // барои филтри "filter"
  role_id  Int?
  enabled  Boolean @default(true)
}

model Log {
  id       Int      @id @default(autoincrement())
  user_id  Int
  action   String
  entity   String
  date     DateTime @default(now())
}
```

- Барои `Log`, беҳтараш як **миёнафзори умумӣ** созед, ки ҳар амали `POST/PUT/DELETE`-ро худкор сабт кунад:
```ts
export function logAction(entity: string, action: string) {
  return async (req, res, next) => {
    res.on("finish", async () => {
      if (res.statusCode < 400) {
        await prisma.log.create({ data: { user_id: req.user.id, action, entity, date: new Date() } });
      }
    });
    next();
  };
}
// истифода: router.post("/students", logAction("Student", "create"), createStudent);
```

---

## 9. Accounting (`/payments`, `/accounting/*`)

Ин модул аз якчанд ҷадвали алоҳида иборат аст, вале ҳама бо ҳамон намунаи 0.1 (list+filter) ва 0.2 (export) сохта мешаванд:

```prisma
model Payment {
  id         Int      @id @default(autoincrement())
  student_id Int
  amount     Int
  discount   Int      @default(0)
  paid       Int
  date       DateTime
  group_id   Int?
  branch_id  Int?
  status     String   // active|prepayment
}

model Budget {
  id                Int      @id @default(autoincrement())
  category_name     String
  from_date         DateTime
  to_date           DateTime
  amount_allocated  Int
  amount_spent      Int      @default(0)
  status            String
}

model Salary { id Int @id @default(autoincrement()) employee_id Int amount Int date DateTime branch_id Int }
model Avans  { id Int @id @default(autoincrement()) employee_id Int amount Int date DateTime branch_id Int }

model Debtor {
  id                  Int      @id @default(autoincrement())
  student_id          Int
  from_date           DateTime
  to_date             DateTime
  total_debt_amount   Int
  payment_per_month   Int
  total_paid_amount   Int      @default(0)
  notes               String?
  status              String   // inprogress|paid
}

model Expense { id Int @id @default(autoincrement()) title String amount Int date DateTime }
```

- `GET /accounting/budget/chart` — `groupBy(['month'])` дар байни санаҳои `from_date`/`to_date` бо `_sum: { amount_allocated, amount_spent }`.
- Барои `status` дар Debtor: метавонед ин майдонро худкор ҳисоб кунед (агар `total_paid_amount >= total_debt_amount` → `paid`), на дасти нигоҳ доред — ин боиси хатогӣ намешавад.

---

## 10. Branches (`/branches`)

```prisma
model Branch {
  id       Int    @id @default(autoincrement())
  title    String
  city     String
  district String
  address  String
}
```
`GET /branches` бо `groups_count`/`students_count` — истифодаи Prisma `_count`:
```ts
const branches = await prisma.branch.findMany({
  include: { _count: { select: { groups: true, students: true } } },
});
```
`GET /branches/chart?year=` — `groupBy(['branch_id', 'month'])` аз Student бо санаи сабтшавӣ.

---

## 11. Jobs (`/jobs`)

CRUD-и хеле оддӣ:
```prisma
model Job {
  id          Int    @id @default(autoincrement())
  title       String
  description String?
  company     String?
}
```
Ин модул айнан монанди намунаи 0.1 (бе филтрҳои иловагӣ) сохта мешавад.

---

## 12. SMS Mailings (`/sms`)

```prisma
model SmsTemplate { id Int @id @default(autoincrement()) title String description String }
model SmsHistory  { id Int @id @default(autoincrement()) title String sent_at DateTime @default(now()) }
```

- `POST /sms/send` — вобаста ба `recipient_type`, аз ҷадвали дахлдор (`Student`, `Lead`, `Employee`, graduates) рӯйхати телефонҳоро мегиред, баъд ба сервиси SMS (масалан Osonsms.com — маъмул дар Тоҷикистон) дархост мефиристед:
```ts
export const sendSms = async (req, res) => {
  const { recipient_type, recipient_ids, template_id, text } = req.body;
  const phones = await getPhonesByType(recipient_type, recipient_ids); // helper вобаста ба намуд
  const message = text || (await prisma.smsTemplate.findUnique({ where: { id: template_id } }))?.description;
  await Promise.all(phones.map((phone) => smsProvider.send(phone, message)));
  await prisma.smsHistory.create({ data: { title: message.slice(0, 50) } });
  res.json({ success: true });
};
```

---

## 13. Тартиби кор — бо кадом навбат созед

1. **Auth** + миёнафзори JWT (боби 0.3, 1)
2. **Branches**, **Courses** — асосӣ, зеро дигарон ба инҳо такя мекунанд
3. **Students**, **Employees**, **Groups** (+ journal)
4. **Leads**, **Timetable**
5. **Accounting** (Payments → Budget → Salary/Avans → Debtors → Expenses)
6. **Administration** (Users/Roles/Permissions/Logs)
7. **SMS**
8. **Dashboard** — дар охир, зеро ба ҳамаи ҷадвалҳои боло такя мекунад
9. Export-ҳо (боби 0.2) — дар ҳар модул баъд аз тайёр шудани list-и он илова кунед

---

## 14. Пакетҳое, ки лозим мешаванд

```bash
npm install express cors dotenv jsonwebtoken bcrypt multer exceljs date-fns
npm install prisma @prisma/client
npm install -D typescript ts-node-dev @types/express @types/node @types/cors @types/jsonwebtoken @types/bcrypt @types/multer
```

---

*Агар хоҳед, метавонам якбора барои як модул (масалан Students ё Groups+Journal) кодҳои пурраи корӣ (routes + controller + Prisma schema) созам, то шумо онро мустақим санҷед.*
