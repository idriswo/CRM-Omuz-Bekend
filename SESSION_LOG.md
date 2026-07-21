# Session Log

Ин файл ҳар як сессияи кориро бо сана/вақт ва рӯйхати корҳои иҷрошуда сабт мекунад.
Дар аввали ҳар "start" ин файл хонда мешавад, дар охири ҳар "stop" сабти нав илова мешавад.

---

## 2026-07-21 — Session 1 (START)

**Вазъият дар оғоз:** Лоиҳа холӣ буд, танҳо `Omuz-CRM-Backend-API-Guide.md` (TZ) вуҷуд дошт.

**Корҳои иҷрошуда:**
- Хониши пурраи TZ (`Omuz-CRM-Backend-API-Guide.md`)
- Сохтани `ROADMAP.md` — 12 фаза, мувофиқи тартиби TZ (боби 13)
- Сохтани `SESSION_LOG.md` (ҳамин файл)
- Сохтани git repository
- Оғози Phase 0 (скелети лоиҳа) ва Phase 1 (Auth)

**Идомаи ҳамин сессия (бе stop — корбар пай дар пай "davom kun" гуфт):**
- Phase 0 (скелет): package.json, tsconfig, Express app, JWT middleware, pagination/export utils — тамом
- Phase 1 (Auth): register/login/refresh-token/forgot-password/logout — тамом
- GitHub remote (`https://github.com/idriswo/CRM-Omuz-Bekend`) пайваст ва push шуд
- Phase 2 (Branches): CRUD + _count + chart — тамом
- Phase 3 (Courses & Leads): CRUD, convert-to-client, transfer, coupons, export — тамом
- Phase 4 (Students): CRUD, multer photo upload, graduates, enroll; Group модели пешакӣ сохта шуд — тамом
- Phase 5 (Employees/Mentors): CRUD + mentor-levels — тамом
- Phase 6 (Groups + Journal): JournalWeek/JournalEntry, upsert-и давомот, stats — тамом
- Phase 7 (Timetable): CRUD + view=day/week/month + repeat_days generation — тамом
- Phase 8 (Accounting): Payment, Budget, Salary, Avans, Debtor (auto-status), Expense — тамом
- Phase 9 (Administration): Role, Permission, Log + logAction миёнафзор ба ҳамаи модулҳо пайваст карда шуд — тамом
- Phase 10 (SMS): SmsTemplate, SmsHistory, smsProvider stub — тамом
- Phase 11 (Dashboard): 9 endpoint-и аналитикӣ — тамом
- Phase 12 (Deploy): `render.yaml` (web + Postgres blueprint) — тамом
- Корбар дар Render deploy кард: https://crm-omuz-bekend.onrender.com/ — кор мекунад (`/health` OK)
- `GET /` илова шуд (ба ҷои "Cannot GET /")
- **Дархости нав аз корбар:** Swagger намебаромад → сабаб фаҳмонда шуд (ҳеҷ гоҳ сохта нашуда буд) → ба TZ (боби 15) ва Roadmap (Phase 13) илова карда шуд → амалӣ карда шуд: `swagger-jsdoc`+`swagger-ui-express`, `src/swagger.ts`, `/api-docs` дар `app.ts`, аннотатсияи `@openapi` ба ҳамаи 69 endpoint дар ҳамаи 13 route-файл
- **Дархости нав:** муддати токенҳо — `access_token` → 3 соат, `refresh_token` → 1 ҳафта (Phase 14), баъдтар ба env variable-ҳо гузаронда шуд (`ACCESS_TOKEN_TTL`/`REFRESH_TOKEN_TTL`)
- **Мушкилии амниятӣ ёфт ва ислоҳ шуд:** дар `.env.example` парол воқеӣ буд (`123456789idris`) — то ин коммит шуда буд ба GitHub. Тоза карда шуд аз файл; корбар гуфт, ки паролии воқеии Postgres-и локалиро худаш иваз мекунад (таърихи git тоза карда нашуд — корбар ин роҳро интихоб кард)
- **Дархости калон — Phase 15 (RBAC + Coin):** 4 нақш (student/admin/superadmin/director) бо иерархияи идоракунии корбарон, coin система (худкор — 10 барои ҳафтаи пурраи ҳозирӣ+балл>90, дастӣ — admin/superadmin/director, харҷ), self-service барои student (`/students/me/*`), toggle `can_add_students` барои admin, бутстрап-и аввалин director тавассути `prisma/seed.ts` — ҳама татбиқ шуд ва тест шуд (route-reachability, зеро DB воқеӣ дар ин муҳит нест)

_(идома дар поён ҳангоми stop илова мешавад)_
