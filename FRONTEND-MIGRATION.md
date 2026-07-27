# Промпт барои frontend — Omuz CRM Backend

> Ин файлро **пурра** нусхабардорӣ карда ба frontend бидиҳед.

---

Backend-и Omuz CRM ба куллӣ навсозӣ шуд. Се тағйири асосӣ:

1. **Вуруд акнун бо email аст, на бо рақами телефон**
2. **Ҳамаи паёмҳо ба email мераванд, на ба SMS** (тавассути Brevo)
3. **Нақши `admin` акнун `mentor` ном дорад** ва ҳудуди ҳар нақш аз нав муайян шуд

Ҳамаи шаклҳои JSON дар ин ҳуҷҷат **аз сервери зинда гирифта шудаанд** — тахминӣ нестанд.

**Суроғаи backend:** `https://crm-omuz-bekend.onrender.com`

⚠️ Плани free-и Render пас аз ~15 дақиқаи бекорӣ хоб меравад. Дархости аввал метавонад **50-60 сония** тӯл кашад. Ин хато нест — timeout-и камтар аз 90 сония нагузоред ва loader-и сабрнок гузоред.

---

# 1. Нақшҳо ва ҳудуди дастрасӣ

Чор нақш. `admin` → **`mentor`** ном иваз кард:

| Пеш | Акнун |
|---|---|
| `director` | `director` — бетағйир |
| `superadmin` | `superadmin` — бетағйир |
| **`admin`** | **`mentor`** (муаллим) |
| `student` | `student` — бетағйир |

Ҳама ҷое, ки дар frontend сатри `"admin"` ҳаст (муқоисаи нақш, `v-if`, номи нақш дар UI) → `"mentor"`.

**`role.id`-ро hardcode накунед.** Аз `GET /api/roles` гиред:
```js
const roles = await api.get("/api/roles");
// [{"id":1,"name":"student"},{"id":2,"name":"mentor"},
//  {"id":3,"name":"superadmin"},{"id":4,"name":"director"}]
const mentorRoleId = roles.find(r => r.name === "mentor").id;
```

## Матритсаи дастрасӣ (182 санҷиш тасдиқ кардааст)

| Бахш | director | superadmin | mentor | student |
|---|:---:|:---:|:---:|:---:|
| Branches, Courses, Leads, Employees | ✅ | ✅ | ❌ | ❌ |
| Dashboard, Email | ✅ | ✅ | ❌ | ❌ |
| Users, Roles, Permissions, Logs | ✅ | ✅ | ❌ | ❌ |
| **Timetable — дидан** | ✅ | ✅ | ✅ * | ❌ |
| Timetable — сохтан/тағйир/нест | ✅ | ✅ | ❌ | ❌ |
| **Гурӯҳҳо — дидан** (list, `:id`, stats, schedule) | ✅ | ✅ | ✅ | ✅ |
| **Журнал** (ҳасту нест, балл) | ✅ | ✅ | ✅ | ❌ |
| Гурӯҳ — сохтан/тағйир/нест | ✅ | ✅ | ❌ | ❌ |
| **Донишҷӯ — дидан** (list, `:id`, activity, leaders) | ✅ | ✅ | ✅ | ❌ |
| Донишҷӯ — сохтан/тағйир/нест/enroll/invite | ✅ | ✅ | ❌ | ❌ |
| **Coin** (додан / харҷ / дидан) | ✅ | ✅ | ✅ | ❌ |
| Payments, Budget, Expenses, Debtors, Overview | ✅ | ✅ | ❌ | ❌ |
| **Ойлик** (salary, avans, accountant) | ✅ | ❌ | ❌ | ❌ |
| Notifications | ✅ | ✅ | ✅ | ✅ |
| `/students/me*` (профили худӣ) | ❌ | ❌ | ❌ | ✅ |

`*` mentor **танҳо дарсҳои худашро** мебинад — бахши 6 бинед.

**mentor = муаллим.** Гурӯҳ ва донишҷӯро мебинад, журнал менависад, coin медиҳад. Донишҷӯ илова карда наметавонад.

**student** ҳамаи гурӯҳҳоро мебинад, вале журнали онҳоро не — танҳо баллҳои худашро.

Рад кардани дастрасӣ ҳамеша чунин аст:
```json
403  { "message": "Дастрасӣ манъ аст" }
```

**Менюро аз рӯи ин матритса пинҳон кунед** — вагарна mentor тугмаҳоеро мебинад, ки ҳамеша 403 медиҳанд.

## Кӣ киро сохта метавонад

| Созанда | Месозад ва нест мекунад |
|---|---|
| **director** | superadmin, mentor, student |
| **superadmin** | mentor, student |
| mentor, student | ҳеҷ кас (ба `/api/users` дастрасӣ надоранд) |

`director`-ро ҳеҷ кас сохта наметавонад — танҳо ҳангоми оғози система.

## ⚠️ Ойлик дар ҷавоб пинҳон мешавад

`/accounting/overview`, `/accounting/net` ва `/accounting/overview/chart` барои **superadmin** майдонҳои ойликро **бар намегардонанд**:

| Майдон | director | superadmin |
|---|:---:|:---:|
| `total_income`, `total_expenses`, `budget_*`, `total_debt*` | ✅ | ✅ |
| `total_salaries`, `total_avans`, `net` | ✅ | **нест** |
| chart: `salaries`, `avans` | ✅ | **нест** |

Дар UI шартан нишон диҳед:
```js
if (data.total_salaries !== undefined) { /* сутуни ойлик */ }
```
Вагарна superadmin `undefined` мебинад.

---

# 2. Вуруд

```
POST /api/auth/login
{ "email": "salim@gmail.com", "password": "MyPass2026" }
```

**200:**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "must_change_password": false,
  "user": {
    "id": 1, "email": "director@example.com", "phone": null,
    "full_name": "Director", "role_id": 4, "branch_id": null,
    "student_id": null, "employee_id": null,
    "must_change_password": false,
    "created_at": "2026-07-26T21:34:20.121Z",
    "role": { "id": 4, "name": "director" }
  }
}
```

- `401` → `{ "message": "Email ё парол хато" }`
- `429` → зиёда аз 10 кӯшиш дар 15 дақиқа

Сервер email-ро худаш нормализа мекунад — `Salim@Gmail.COM` ва `salim@gmail.com` як ҳисобанд.

## Токени нав
```
POST /api/auth/refresh-token   { "refresh_token": "..." }   →  { "access_token": "..." }
```

## Баромадан
```
POST /api/auth/logout          (токен ҲАТМӢ, body лозим нест)
```
Пеш `{ user_id }` дар body мерафт ва токен лозим набуд — акнун баръакс.

---

# 3. `must_change_password` — экрани нав лозим аст

Агар `must_change_password: true` бошад → **фавран ба экрани ивази парол**. Ин ҳисобест, ки паролаш аз тарафи система сохта ва бо email фиристода шудааст.

То ивази парол ҳар дархост ба `/api/*` (ба ҷуз `/api/auth/*`):
```json
403
{
  "message": "Аввал паролро иваз кунед",
  "must_change_password": true,
  "change_password_endpoint": "POST /api/auth/change-password"
}
```

**Дар interceptor-и HTTP коркард кунед** — на дар ҳар экран алоҳида:
```js
if (res.status === 403 && res.data?.must_change_password) {
  router.push("/change-password");
}
```

```
POST /api/auth/change-password        (токен)
{ "old_password": "...", "new_password": "..." }
```
- `400` парол камтар аз 8 аломат
- `400` пароли нав ба кӯҳна баробар
- `401` пароли кӯҳна хато
- `200` → **корбар бояд аз нав ворид шавад** (токенҳои кӯҳна бекор мешаванд)

---

# 4. Барқарорсозии парол — акнун СЕ қадам

Пеш ду қадам буд.

## Қадами 1 — код

```
POST /api/auth/forgot-password
{ "email": "salim@gmail.com" }
```

Ҷавоб **ҳамеша 200**:
```json
{ "message": "Агар ин суроға дар система бошад, код фиристода шуд" }
```

⚠️ Ин қасдан чунин аст — то маълум нашавад кадом суроғаҳо сабтанд. **«Ин email ёфт нашуд» нанависед** — сервер инро ҳеҷ гоҳ намегӯяд.

Код **10 дақиқа** эътибор дорад. Маҳдудият: **5 дархост дар як соат**.

## Қадами 2 — код → reset_token

```
POST /api/auth/verify-reset-code
{ "email": "salim@gmail.com", "code": "036370" }
```

**200:**
```json
{
  "success": true, "valid": true,
  "reset_token": "cad72af9173d3c080426f52ac55eb6f01eb0e36a58fe706c33bad70c4c28ccaf",
  "expires_in_minutes": 15
}
```

`reset_token`-ро дар state нигоҳ доред (на localStorage — 15 дақиқа зиндагӣ мекунад).

**Коди хато (400):**
```json
{ "message": "Код хато ё мӯҳлаташ гузаштааст", "attempts_left": 4 }
```
`attempts_left`-ро нишон диҳед: «Код хато. 4 кӯшиш мондааст».

**Пас аз 5 кӯшиши нодуруст (400):**
```json
{ "message": "Код 5 маротиба хато ворид шуд ва бекор карда шуд. Аз нав дархост кунед." }
```
→ корбарро ба қадами 1 баргардонед.

## Қадами 3 — пароли нав

```
POST /api/auth/reset-password
{ "reset_token": "cad72af9...", "new_password": "NewPass2026" }
```

⚠️ **`email` ва `code` дигар фиристода намешаванд** — танҳо `reset_token`.

- `200` → ба экрани login баред
- `400` токен хато/мӯҳлаташ гузашта, ё парол камтар аз 8 аломат
- Токен **як бор** кор мекунад

---

# 5. Сохтани ҳисоб — парол ба email меравад

```
POST /api/users                    (director ё superadmin)
{
  "email": "salim@gmail.com",
  "full_name": "Салим Ҷӯраев",
  "role_id": 3,
  "phone": "931112233",     // ихтиёрӣ — танҳо алоқа
  "branch_id": 1,           // ихтиёрӣ
  "employee_id": 7          // ихтиёрӣ — БАРОИ MENTOR лозим, бахши 6 бинед
}
```

**`password` нафиристед** — сервер пароли тасодуфии 10-аломата месозад ва бо email мефиристад.

**201:**
```json
{
  "id": 2, "email": "salim@gmail.com", "phone": "992931112233",
  "full_name": "Салим Ҷӯраев", "role_id": 3,
  "must_change_password": true,
  "email_sent": true,
  "login_credentials": { "email": "salim@gmail.com", "password": "yrm4DjECGU" }
}
```

- `email_sent: true` → «маълумот ба почтаи ӯ фиристода шуд»
- `email_sent: false` → `email_error` низ меояд. **`login_credentials`-ро дар экран нишон диҳед**, то корманд дастӣ диҳад
- `login_credentials.password` **танҳо ҳамин як бор** бармегардад
- `400` email нодуруст · `409` email такрорӣ
- `phone` худкор ба `992XXXXXXXXX` меояд — дар UI ҳамчун `+992 93 111 22 33` нишон диҳед

**Навсозӣ:** `PUT /api/users/:id` — `{ email?, phone?, full_name?, role_id?, branch_id?, employee_id? }`

## ❌ `PUT /users/:id/toggle-add-students` НЕСТ шуд

Endpoint `404` медиҳад, майдони `can_add_students` аз ҷавоб нест шуд. Аз frontend бароред.

---

# 6. `employee_id` — mentor-ро ба корманд пайваст мекунад

Барои он ки mentor **ҷадвали дарсҳои ХУДашро** бинад, ҳисобаш бояд ба сабти `Employee` пайваст бошад.

Дар формаи сохтани mentor **майдони интихоби корманд** гузоред (аз `GET /api/employees`):

```
POST /api/users
{ "email": "muallim@gmail.com", "full_name": "Салим",
  "role_id": <mentor>, "employee_id": 7 }
```

Ё баъдтар: `PUT /api/users/:id { "employee_id": 7 }`

- `404` корманд ёфт нашуд
- `409` он корманд аллакай ҳисоб дорад
- `400` `employee_id` нодуруст

## Рафтори ҷадвал барои mentor

| Ҳолат | Натиҷа |
|---|---|
| `employee_id` пайваст нест | `GET /api/timetable` → **рӯйхати холӣ** (`[]`, на хато) |
| пайваст ҳаст | танҳо дарсҳои худаш |
| `?mentor_id=<ҳамкор>` | нодида гирифта мешавад — ҷадвали ҳамкорро дида наметавонад |
| `GET /api/timetable/:id` дарси ҳамкор | `404` |
| `POST/PUT/DELETE /api/timetable` | `403` |

director ва superadmin ҳамаи дарсҳоро мебинанд.

---

# 7. Донишҷӯ ва ҳисоби ӯ

## Сохтан
```
POST /api/students     (director/superadmin)
{ "first_name": "Фарҳод", "last_name": "Каримов",
  "phone": "922223344",        // ҲАТМӢ
  "email": "farhod@mail.ru",   // ихтиёрӣ, ВАЛЕ бе он ҳисоб гирифта наметавонад
  "birth_date": "2004-05-20", "gender": "male" }
```

**Email-ро майдони муҳим кунед** — бе он донишҷӯ ба система ворид шуда наметавонад.

## Ҳисоб додан (Invite)
```
POST /api/students/:id/invite
{ "email": "farhod@mail.ru" }     // ихтиёрӣ, агар дар профил набошад
```

**201:**
```json
{ "success": true,
  "login_credentials": { "email": "farhod@mail.ru", "password": "46MKdeayet", "email_sent": true } }
```

- `400` → `"Ин донишҷӯ email надорад. Email-ро дар профил гузоред ё дар ҳамин дархост фиристед."`
  → дар UI майдони email нишон диҳед ва пурсед
- `409` бо ин email аллакай корбар ҳаст

## Кабинети донишҷӯ (танҳо нақши student)

```
GET /api/students/me            профили пурра
GET /api/students/me/groups     гурӯҳҳои худаш      → []
GET /api/students/me/groupmates ҳамгурӯҳон
GET /api/students/me/scores     баллҳои худаш       → []
GET /api/students/me/coins      → { "balance": 0, "transactions": [] }
```

`GET /api/students/me`:
```json
{ "id": 1, "full_name": "Каримов Фарҳод", "first_name": "Фарҳод", "last_name": "Каримов",
  "birth_date": "2004-05-20", "age": 22, "gender": "male", "address": "",
  "email": "f@x.com", "phone": "992922223344", "father_phone": "",
  "phones": [{ "label": "Student", "number": "992922223344" }],
  "groups": [], "status": "active", "has_account": true,
  "contract_status": "active", "is_top": false, "branch_id": null,
  "telegram_username": "", "description": "", "photo": null, "coin_balance": 0 }
```

⚠️ Агар ҳисоби student ба профил пайваст набошад → `404`, на `500`.

Донишҷӯ инчунин **ҳамаи гурӯҳҳоро** мебинад: `GET /api/groups`, `GET /api/groups/:id`

---

# 8. Модули SMS → Email

| Пеш | Акнун |
|---|---|
| `GET /api/sms/templates` | `GET /api/email/templates` |
| `POST /api/sms/templates` | `POST /api/email/templates` |
| `PUT /api/sms/templates/:id` | `PUT /api/email/templates/:id` |
| `DELETE /api/sms/templates/:id` | `DELETE /api/email/templates/:id` |
| `POST /api/sms/send` | `POST /api/email/send` |
| `GET /api/sms/history` | `GET /api/email/history` |
| `GET /api/sms/recipients/group?group_id=` | `GET /api/email/recipients/group?group_id=` |
| `GET /api/sms/recipients/students` | `GET /api/email/recipients/students` |
| `GET /api/sms/recipients/mentors` | `GET /api/email/recipients/mentors` |
| `GET /api/sms/recipients/graduates` | `GET /api/email/recipients/graduates` |
| `GET /api/sms/recipients/leads` | ❌ **НЕСТ шуд** |

Дар меню «SMS» → «Email».

## Фиристодан
```
POST /api/email/send
{ "recipient_type": "Student",        // Student | Employee | Graduate
  "recipient_ids": [1, 2, 3],         // ҲАТМАН массиви ғайрихолӣ
  "subject": "Хабари муҳим",
  "text": "Дарси фардо соати 18:00" }
```
ё бо шаблон: `{ "recipient_type": "Student", "recipient_ids": [1], "template_id": 5 }`

**200:**
```json
{ "success": true, "sent_count": 3, "failed_count": 0,
  "recipients_count": 3, "mail_enabled": true }
```

- `mail_enabled: false` → сервер дар режими тестӣ, паём **воқеан нарафт**. Огоҳӣ нишон диҳед
- `failed_count > 0` → як қисм нарасид
- `400` `recipient_ids` холӣ ё нест
- `404` ҳеҷ яке аз ретсипиентҳо email надорад
- `recipient_type: "Lead"` дигар кор намекунад (`400`) — лидҳо email надоранд

## Ретсипиентҳо
`GET /api/email/recipients/*` **танҳо онҳоеро** бармегардонад, ки email доранд:
```json
[{ "id": 1, "full_name": "Фарҳод Каримов", "email": "farhod@mail.ru" }]
```
(пеш `phone` буд)

Дар UI эзоҳ гузоред: «танҳо онҳое, ки email доранд».

---

# 9. Чизҳои умумӣ

## Пагинация
```json
{ "data": [...], "meta": { "total": 0, "page": 1, "limit": 20 } }
```
`?limit=` ба **200** маҳдуд аст. Агар `?limit=1000` фиристед, сервер 200 медиҳад.

`?sort_by=` танҳо майдонҳои иҷозатдодашударо қабул мекунад — номи ношинос ба `id` бармегардад (хато намедиҳад).

## `429 Too Many Requests`
```json
{ "message": "Дархостҳо аз ҳад зиёданд. Каме сонитар кӯшиш кунед.", "retry_after_seconds": 3600 }
```
Header-и `Retry-After` низ меояд.

| Endpoint | Маҳдудият |
|---|---|
| `login` | 10 дар 15 дақиқа |
| `forgot-password` | **5 дар 1 соат** |
| `verify-reset-code`, `reset-password` | 10 дар 15 дақиқа |

## Кодҳои хато
| Код | Маъно |
|---|---|
| `400` | маълумоти нодуруст — `message` фаҳмо аст, онро нишон диҳед |
| `401` | токен нест/нодуруст, ё парол хато |
| `403` | нақш иҷозат надорад (ё `must_change_password`) |
| `404` | ёфт нашуд |
| `409` | такрорӣ (email банд) ё вобастагӣ мавҷуд |
| `429` | дархостҳо зиёданд |
| `500` | хатои сервер — набояд рӯй диҳад, гузориш диҳед |

## Рақами телефон
Дар база ҳамеша `992XXXXXXXXX`. Ҳангоми фиристодан ҳар шакл мешавад — сервер худаш табдил медиҳад:
```
902223344 · +992 90 222 33 44 · 90-222-33-44 · 8 90 222 3344
```
Рақами нодуруст → `400` бо паёми фаҳмо.
Дар UI ҳамчун `+992 90 222 33 44` нишон диҳед.

---

# 10. Рӯйхати корҳо

- [ ] `BASE_URL` → `https://crm-omuz-bekend.onrender.com`, timeout ≥ 90 сония
- [ ] Экрани login: `phone` → `email`
- [ ] Экрани нави «Ивази парол» + interceptor барои `403 must_change_password`
- [ ] Занҷири forgot-password: **се қадам**, нигоҳ доштани `reset_token`, нишон додани `attempts_left`
- [ ] `reset-password` акнун `{ reset_token, new_password }` мефиристад
- [ ] Формаи сохтани корбар: `email`, **майдони парол нест кунед**, `login_credentials` нишон диҳед агар `email_sent: false`
- [ ] Формаи mentor: **майдони интихоби корманд** (`employee_id`)
- [ ] Формаи донишҷӯ: email майдони муҳим
- [ ] Нақши `"admin"` → `"mentor"` дар ҳама ҷо; `role.id` аз `GET /api/roles`
- [ ] Менюро аз рӯи матритсаи дастрасӣ пинҳон кунед (mentor бисёр чизро намебинад)
- [ ] Ойлик шартан: `if (data.total_salaries !== undefined)`
- [ ] `/api/sms/*` → `/api/email/*`, меню «SMS» → «Email»
- [ ] `recipient_type: "Lead"` нест кунед
- [ ] Ретсипиентҳо `phone` → `email`
- [ ] `toggle-add-students` ва `can_add_students` нест кунед
- [ ] `logout` бо токен, бе body
- [ ] Экрани сабти ном (register) агар бошад — нест кунед
- [ ] Коркарди `429` бо `retry_after_seconds`
- [ ] Матнҳои «SMS» ва «рақами телефон» дар контексти вуруд → «email»
