# Omuz CRM Backend — Roadmap

Ин ҳуҷҷат ҳолати сохтани ҳар як endpoint ва фазаро нишон медиҳад.
Манбаъ: `Omuz-CRM-Backend-API-Guide.md`

Аломатҳо: `[ ]` — нашуда, `[~]` — дар ҷараён, `[x]` — тамом шуд

---

## Phase 0 — Скелети лоиҳа (project scaffolding)
- [ ] package.json, tsconfig.json
- [ ] Prisma init + schema.prisma (базавӣ)
- [ ] Express app (`src/app.ts`, `src/server.ts`)
- [ ] `src/utils/pagination.ts` (getPagination, buildEnvelope)
- [ ] `src/utils/export.ts` (exportToXlsx)
- [ ] `src/middlewares/auth.middleware.ts` (JWT)
- [ ] `.env.example`, `.gitignore`

## Phase 1 — Auth (`/auth`)
- [ ] Prisma model `User`
- [ ] `POST /auth/register`
- [ ] `POST /auth/login`
- [ ] `POST /auth/refresh-token`
- [ ] `POST /auth/forgot-password`
- [ ] `POST /auth/logout`

## Phase 2 — Branches (`/branches`)
- [ ] Prisma model `Branch`
- [ ] `GET /branches` (бо groups_count/students_count)
- [ ] `POST /branches`
- [ ] `PUT /branches/:id`
- [ ] `DELETE /branches/:id`
- [ ] `GET /branches/chart?year=`

## Phase 3 — Courses & Leads (`/courses`, `/leads`)
- [ ] Prisma models `Course`, `Lead`, `Coupon`
- [ ] CRUD `/courses`
- [ ] CRUD `/leads` (list бо pagination/search)
- [ ] `POST /leads/:id/convert-to-client`
- [ ] `POST /leads/transfer`
- [ ] `GET /leads/coupons`, `POST /leads/coupons`
- [ ] Export leads (xlsx)

## Phase 4 — Students (`/students`)
- [ ] Prisma model `Student` (+ Contract)
- [ ] `GET /students` (pagination/search/course_id/group_id/contract_status)
- [ ] `POST /students` (multipart/form-data, multer)
- [ ] `PUT /students/:id`, `DELETE /students/:id`
- [ ] `GET /students/graduates`
- [ ] `PUT /students/graduates/:id`
- [ ] `GET /students/graduates/stats`
- [ ] `POST /students/enroll`

## Phase 5 — Employees / Mentors (`/employees`)
- [ ] Prisma model `Employee`, `MentorLevel`
- [ ] CRUD `/employees`
- [ ] `GET /employees/mentor-levels`, `PUT /employees/mentor-levels/:id`

## Phase 6 — Groups + Journal (`/groups`)
- [ ] Prisma models `Group`, `JournalWeek`, `JournalEntry`
- [ ] CRUD `/groups`
- [ ] `GET /groups/:id/journal`
- [ ] `POST /groups/:id/journal/week`
- [ ] `PUT /groups/:id/journal/:weekId/students/:studentId` (upsert)
- [ ] `GET /groups/stats`

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
