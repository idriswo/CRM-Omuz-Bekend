# Omuz CRM Backend — Roadmap

Ин ҳуҷҷат ҳолати сохтани ҳар як endpoint ва фазаро нишон медиҳад.
Манбаъ: `Omuz-CRM-Backend-API-Guide.md`

Аломатҳо: `[ ]` — нашуда, `[~]` — дар ҷараён, `[x]` — тамом шуд

---

## Phase 0 — Скелети лоиҳа (project scaffolding)
- [x] package.json, tsconfig.json
- [x] Prisma init + schema.prisma (базавӣ)
- [x] Express app (`src/app.ts`, `src/server.ts`)
- [x] `src/utils/pagination.ts` (getPagination, buildEnvelope)
- [x] `src/utils/export.ts` (exportToXlsx)
- [x] `src/middlewares/auth.middleware.ts` (JWT)
- [x] `.env.example`, `.gitignore`

## Phase 1 — Auth (`/auth`)
- [x] Prisma model `User` (+ `refresh_token` барои иваз кардани токен)
- [x] `POST /auth/register`
- [x] `POST /auth/login`
- [x] `POST /auth/refresh-token`
- [x] `POST /auth/forgot-password` (сохтори асосӣ тайёр; фиристодани воқеии SMS дар Phase 10 пайваст мешавад)
- [x] `POST /auth/logout`

## Phase 2 — Branches (`/branches`)
- [x] Prisma model `Branch`
- [x] `GET /branches` (⚠️ бе groups_count/students_count то ҳол — вобаста ба Phase 4/6)
- [x] `GET /branches/:id`
- [x] `POST /branches`
- [x] `PUT /branches/:id`
- [x] `DELETE /branches/:id`
- [ ] `GET /branches/chart?year=` — stub (501), баъд аз Phase 4 (Student) пур карда мешавад
- [ ] **TODO баъдтар:** ба `GET /branches` counts (`_count: { groups, students }`) илова кунед, вақте Group/Student моделҳо тайёр шаванд

## Phase 3 — Courses & Leads (`/courses`, `/leads`)
- [x] Prisma models `Course`, `Lead`, `Coupon`
- [x] CRUD `/courses`
- [x] CRUD `/leads` (list бо pagination/search/course_id/type/utm_source)
- [x] `POST /leads/:id/convert-to-client` (⚠️ сохтани Student аз лид дар Phase 4 илова мешавад)
- [x] `POST /leads/transfer`
- [x] `GET /leads/coupons`, `POST /leads/coupons`
- [x] Export leads (xlsx) — `GET /leads/export`

## Phase 4 — Students (`/students`)
- [x] Prisma models `Student`, `Contract`, `GraduateInfo`
- [x] Prisma model `Group` (пешакӣ оварда шуд аз боби 4, бе journal — ниг. Phase 6)
- [x] `GET /students` (pagination/search/course_id/group_id/status/contract_status)
- [x] `POST /students` (multipart/form-data, multer → `/uploads`)
- [x] `PUT /students/:id`, `DELETE /students/:id`
- [x] `GET /students/graduates`
- [x] `PUT /students/graduates/:id`
- [x] `GET /students/graduates/stats`
- [x] `POST /students/enroll`
- [x] **Пӯшидани TODO-и Phase 2:** `GET /branches` бо `_count` (groups/students), `GET /branches/chart?year=` амалӣ карда шуд

## Phase 5 — Employees / Mentors (`/employees`)
- [x] Prisma model `Employee`, `MentorLevel`
- [x] CRUD `/employees` (search, branch_id, position)
- [x] `GET /employees/mentor-levels`, `PUT /employees/mentor-levels/:id`

## Phase 6 — Groups + Journal (`/groups`)
- [x] Prisma model `Group` (сохта шуд дар Phase 4)
- [x] Prisma models `JournalWeek`, `JournalEntry` (бо `@@unique([week_id, student_id, day_date])`)
- [x] CRUD `/groups` (search/course_id/branch_id/status/tag)
- [x] `GET /groups/:id/journal`
- [x] `POST /groups/:id/journal/week`
- [x] `PUT /groups/:id/journal/:weekId/students/:studentId` (upsert)
- [x] `GET /groups/stats`

## Phase 7 — Timetable (`/timetable`)
- [ ] Prisma model `TimetableEntry`
- [ ] CRUD `/timetable`
- [ ] `GET /timetable?view=day|week|month` (+ repeat_days generation)

## Phase 8 — Accounting (`/payments`, `/accounting/*`)
- [ ] Prisma models `Payment`, `Budget`, `Salary`, `Avans`, `Debtor`, `Expense`
- [ ] CRUD `/payments` + export
- [ ] CRUD `/accounting/budget` + `GET /accounting/budget/chart`
- [ ] CRUD `/accounting/salary`, `/accounting/avans`
- [ ] CRUD `/accounting/debtors` (auto status) + export
- [ ] CRUD `/accounting/expenses`

## Phase 9 — Administration (`/users`, `/permissions`, `/roles`, `/logs`)
- [ ] Prisma models `Role`, `Permission`, `Log`
- [ ] CRUD `/users`, `/roles`, `/permissions`
- [ ] `GET /logs`
- [ ] Миёнафзори `logAction` (auto-log)

## Phase 10 — SMS Mailings (`/sms`)
- [ ] Prisma models `SmsTemplate`, `SmsHistory`
- [ ] CRUD `/sms/templates`
- [ ] `POST /sms/send`
- [ ] `GET /sms/history`

## Phase 11 — Dashboard (`/dashboard`)
- [ ] `GET /dashboard/stats`
- [ ] `GET /dashboard/attendance-log?date=`
- [ ] `GET /dashboard/groups-summary`
- [ ] `GET /dashboard/leads-chart?year=`
- [ ] `GET /dashboard/attendance-chart?month=`
- [ ] `GET /dashboard/income?month=`
- [ ] `GET /dashboard/enroll-chart`
- [ ] `GET /dashboard/employed-graduates`
- [ ] `GET /dashboard/left-courses`

## Phase 12 — Deploy (Render)
- [ ] `render.yaml` / танзимоти Render
- [ ] Environment variables дар Render
- [ ] Prisma migrate deploy дар build command

---

## Зарросҳои иловагӣ (аз ҳамкорон, тавассути pull)
_Ин қисм ҳар вақте ки zapros нав аз TZ илова мешавад, инҷо низ илова мегардад._

(ҳоло холӣ аст)
