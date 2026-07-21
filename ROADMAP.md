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
- [x] Prisma model `TimetableEntry`
- [x] CRUD `/timetable`
- [x] `GET /timetable?view=day|week|month` (+ repeat_days generation дар JS)

## Phase 8 — Accounting (`/payments`, `/accounting/*`)
- [x] Prisma models `Payment`, `Budget`, `Salary`, `Avans`, `Debtor`, `Expense`
- [x] CRUD `/payments` + export
- [x] CRUD `/accounting/budget` + `GET /accounting/budget/chart`
- [x] CRUD `/accounting/salary`, `/accounting/avans`
- [x] CRUD `/accounting/debtors` (status худкор ҳисоб мешавад: paid/inprogress) + export
- [x] CRUD `/accounting/expenses`

## Phase 9 — Administration (`/users`, `/permissions`, `/roles`, `/logs`)
- [x] Prisma models `Role`, `Permission`, `Log` (+ `User.role` relation)
- [x] CRUD `/users`, `/roles`, `/permissions`
- [x] `GET /logs`
- [x] Миёнафзори `logAction` (auto-log) — сохта ва ба **ҳамаи** мутатсияҳои create/update/delete-и модулҳои қаблӣ (Branches, Courses, Leads, Students, Employees, Groups+Journal, Timetable, Payments, Accounting, Administration) пайваст карда шуд

## Phase 10 — SMS Mailings (`/sms`)
- [x] Prisma models `SmsTemplate`, `SmsHistory`
- [x] CRUD `/sms/templates`
- [x] `POST /sms/send` (⚠️ `smsProvider` — stub, интизори SMS_API_KEY-и воқеӣ, масалан Osonsms.com)
- [x] `GET /sms/history`
- [x] Auth `forgotPassword` (Phase 1) метавонад ба ин `smsProvider` пайваст шавад, вақте provider воқеӣ илова шуд

## Phase 11 — Dashboard (`/dashboard`)
- [x] `GET /dashboard/stats`
- [x] `GET /dashboard/attendance-log?date=`
- [x] `GET /dashboard/groups-summary`
- [x] `GET /dashboard/leads-chart?year=`
- [x] `GET /dashboard/attendance-chart?month=`
- [x] `GET /dashboard/income?month=`
- [x] `GET /dashboard/enroll-chart?year=`
- [x] `GET /dashboard/employed-graduates`
- [x] `GET /dashboard/left-courses`
- ⚠️ **Эзоҳи муҳим:** TZ дар ин боб аз ҷадвали алоҳидаи `Attendance` (бо `status: present|absent|late`) ёдовар мешавад, вале мо дар Phase 6 attendance-ро ҳамчун майдони `Boolean` дар `JournalEntry` сохтем (мутобиқи боби 4-и TZ). Бинобар ин "late" дар ягон endpoint дастрас нест (0 бармегардад) — агар лозим шавад, майдони алоҳидаи `late` ба `JournalEntry` илова кардан мумкин аст.

## Phase 12 — Deploy (Render)
- [x] `render.yaml` (Blueprint: web service + Postgres database)
- [x] Environment variables (`DATABASE_URL` аз Render Postgres, `JWT_SECRET`/`JWT_REFRESH_SECRET` худкор generate мешаванд)
- [x] `startCommand: npx prisma db push && npm start` — ⚠️ **эзоҳ:** азбаски мо ҳанӯз ягон real Postgres надоштем, миграцияи расмии Prisma (`prisma/migrations/`) сохта нашудааст. Барои ҳозира аз `prisma db push` истифода бурдем (схемаро мустақим ба база менависад). Вақте ки лоиҳа устувор шуд, тавсия дода мешавад бо `prisma migrate dev` дар муҳити воқеӣ migration-ҳои расмӣ сохта, ба `prisma migrate deploy` гузаред.

---

## Phase 13 — Swagger (API Documentation)
_Дархости иловагии корбар (2026-07-21): "chida swagerra namebarorad" → сабаб: Swagger ҳеҷ гоҳ сохта нашуда буд. Ба TZ (боби 15) ва ин ҷо илова карда шуд._

- [x] Насби `swagger-jsdoc` + `swagger-ui-express` (+ типҳо)
- [x] `src/swagger.ts` — конфигуратсияи OpenAPI 3.0, скан аз `src/modules/**/*.routes.ts`
- [x] Пайваст дар `src/app.ts`: `/api-docs` (берун аз authMiddleware, то UI бе токен кушода шавад)
- [x] Аннотатсияи `@openapi` ба **ҳамаи 69 endpoint** дар ҳамаи route-файлҳо (Auth, Branches, Courses, Leads, Students, Employees, Groups+Journal, Timetable, Payments, Accounting, Administration, SMS, Dashboard)
- [x] `bearerAuth` security scheme + тугмаи Authorize дар UI
- [x] `GET /` — паёми хуш (ба ҷои "Cannot GET /" дар root)

## Phase 14 — Танзими муддати токенҳо
_Дархости иловагии корбар (2026-07-21): "refreshtoken, access token davavit kun ... yatash 1 haftayina, yatai digasha 3 soata kun"_

- [x] `access_token` → **3 соат** (пештар 15 дақиқа буд)
- [x] `refresh_token` → **1 ҳафта** (пештар 30 рӯз буд)
- Ҷойгиршуда дар `src/modules/auth/auth.controller.ts` (константаҳои `ACCESS_TOKEN_TTL`/`REFRESH_TOKEN_TTL`), истифода дар `login` ва `refreshToken`

## Phase 15 — RBAC (4 нақш) + Coin система
_Дархости иловагии корбар (2026-07-21): "4 ta roll hast student, admin, superadmin, director ..."_

**Иерархияи нақшҳо:**
- `student` — фақат маълумоти худашро мебинад: баллҳо/давомот, гурӯҳҳо, ҳамкурсҳо, coin
- `admin` — CRUD дар Students/Groups/Journal/Branches/Courses/Leads/Employees/Timetable/SMS/Dashboard; **дастрасӣ надорад** ба Payments/Accounting (ойлик/финанс); илова кардани донишҷӯ вобаста ба toggle-и `can_add_students`
- `superadmin` — ҳама чизи admin + идораи `admin`/`student` (сохтан/нест кардан) + toggle-и `can_add_students`; **дастрасӣ надорад** ба Payments/Accounting (танҳо director)
- `director` — дастрасии пурра ба ҳама чиз, аз ҷумла Payments/Accounting ва идораи `superadmin`/`admin`/`student`

**Татбиқ:**
- [x] `prisma/schema.prisma`: `User.student_id` (пайваст ба Student), `User.can_add_students`, модели `CoinTransaction`, `Student.coin_balance`
- [x] `src/constants/roles.ts` — ROLES, ROLE_CREATE_MATRIX (кӣ киро сабт/нест карда метавонад)
- [x] `prisma/seed.ts` — сохтани 4 Role + бутстрап-и аввалин `director` (аз `SEED_DIRECTOR_PHONE`/`SEED_DIRECTOR_PASSWORD`)
- [x] `src/middlewares/rbac.middleware.ts` — `authorize()`, `selfStudentOr()`, `requireCanAddStudents()`
- [x] JWT (login/refresh) акнун `role` (номи он) ва `student_id`-ро дар бар мегирад
- [x] `/auth/register` дигар `role_id`-ро аз body қабул намекунад (то касе худро director эълон накунад) — таъини нақш танҳо тавассути `/users` (бо иерархия)
- [x] `POST /students` акнун login (User бо role=student)-ро низ худкор месозад ва `login_credentials`-ро дар ҷавоб бармегардонад
- [x] `/students/me`, `/me/groups`, `/me/groupmates`, `/me/scores`, `/me/coins` — self-service барои student
- [x] `PUT /users/:id/toggle-add-students` — фаъол/хомӯш кардани иҷозати admin
- [x] `POST/GET /students/:id/coins`, `POST /students/:id/coins/spend` — иловаи дастӣ/харҷ/дидан
- [x] Coin-и худкор (10 адад): дар `upsertJournalEntry`, вақте ҳафта пур шуд — агар ҳамаи рӯзҳо attendance=true бошанд ва миёнаи балл >90
- [x] RBAC ба ҳамаи роутҳо пайваст шуд: Branches/Courses/Leads/Employees/Groups/Timetable/SMS/Dashboard → admin+superadmin+director; Payments/Accounting → **фақат director** (2026-07-21: аз superadmin низ гирифта шуд); Administration → фақат superadmin+director
- ⚠️ **Маҳдудият:** "late" (дер омадан) дар JournalEntry вуҷуд надорад (танҳо `attendance: Boolean`) — бинобар ин шарти coin танҳо ба ҳозирӣ+балл такя мекунад, на ба дер омадан (ҳамон маҳдудияти Dashboard дар Phase 11)

## Phase 16 — Бехатарии иловагӣ (пас аз Phase 15)
_Дархости корбар: "hamasha soz kun ki bexatar wavad ва барои director ном/парoли пешфарз (по умолчанию)"_

- [x] `SEED_DIRECTOR_PHONE`/`SEED_DIRECTOR_PASSWORD` дар `render.yaml` акнун қиммати **маълум** доранд (на random) — `900000000` / `Director@2026!` — то дастрас бошад бе кофтани Render dashboard
- [x] `POST /auth/change-password` илова шуд (ҳифзшуда бо `authMiddleware`) — ҳар корбар (аз ҷумла director) метавонад пас аз аввалин вуруд паролии пешфарзро иваз кунад
- [x] Тасдиқ карда шуд: `ROLE_CREATE_MATRIX` аллакай иҷозат медиҳад, ки director → superadmin/admin/student-ро сабт/нест кунад (аз Phase 15)
- ⚠️ **Тавсия ба корбар:** дарҳол пас аз аввалин deploy, бо `900000000` / `Director@2026!` ворид шавед ва тавассути `POST /auth/change-password` паролро иваз кунед — парол дар код/render.yaml навишта шудааст, пас маълум аст ва бояд танҳо барои бутстрап истифода шавад

## Phase 17 — Ислоҳи хатогии critical: server crash (502)
_Дархости корбар: "kani bin kadom zapros kor mekunad kadomash kor namekunad" — санҷиши пурраи ҳамаи 70+ endpoint дар Render_

**Мушкила:** Ҳангоми санҷиши пурра (ҳама модул, аз ҷумла CRUD, self-service, coin, journal, RBAC hierarchy) маълум шуд, ки қариб ҳама чиз дуруст кор мекунад, **ба ғайр аз** `DELETE /courses/:id` ва `DELETE /leads/:id` — ин ду 502 (Bad Gateway) доданд. Тафтиши Render logs (`server_failed`, `nonZeroExit: 1`) тасдиқ кард, ки **тамоми процесси Node crash мекунад**.

**Сабаби реша:** Ҳама controller-ҳо `async (req, res) => {...}` буданд, бе `try/catch`. Дар Express 4, агар promise дар як async route handler reject шавад (масалан Prisma хатогии `P2003` — foreign key constraint, вақте кӯшиши нест кардани Course/Lead-е, ки дар Group/Coupon истифода мешавад), ин ҳамчун **unhandled promise rejection** боқӣ мемонад ва Node.js тамоми процессро мекушад. Ин маънои онро дошт, ки **як хатогии як endpoint метавонист тамоми серверро барои ҳама корбарон вайрон кунад** — маҳз ҳамин сабаби "баъзе zapros кор мекунад, баъзеаш не" буд аз frontend (дар вақти crash+restart-и Render, ҳама дархостҳо 502 мегиранд).

**Ҳал:**
- [x] `express-async-errors` насб ва дар аввали `src/app.ts` import карда шуд — ҳамаи хатогиҳои async-и route handler-ҳоро худкор мегирад
- [x] `src/middlewares/error.middleware.ts` — миёнафзори марказии хатогиҳо (охирин дар занҷира), бо коркарди махсуси хатогиҳои Prisma:
  - `P2025` (сабт ёфт нашуд) → 404
  - `P2003` (foreign key — истифода мешавад дар ҷои дигар) → 409
  - `P2002` (такрорӣ/unique) → 409
  - дигар → 500 (бе crash)
- [x] `404` handler барои роутҳои номаълум
- [x] `src/server.ts`: `process.on("unhandledRejection")` ва `process.on("uncaughtException")` — safety net-и иловагӣ, то ҳатто хатогии берун аз Express серверро накушад
- [x] Тасдиқ шуд (пас аз deploy): DELETE-и Course/Lead-и истифодашаванда акнун **409** медиҳад (паём: "дар ҷои дигар истифода мешавад"), на 502/crash

**Санҷиши пурраи дигар (ҳама 200/дуруст буданд):** Auth, Branches, Courses, Leads (create/convert/coupon), Students (CRUD+multipart+graduates+enroll), Employees, Groups+Journal (+ coin-и худкор санҷида шуд — кор мекунад!), Timetable, SMS, Payments, Accounting, Administration (+ иерархияи нақшҳо: director↔superadmin↔admin санҷида шуд, ҳама дуруст), Dashboard (9 endpoint), Coin (дастӣ+харҷ+худкор), change-password, toggle-add-students.

## Зарросҳои иловагӣ (аз ҳамкорон, тавассути pull)
_Ин қисм ҳар вақте ки zapros нав аз TZ илова мешавад, инҷо низ илова мегардад._

(ҳоло холӣ аст)
