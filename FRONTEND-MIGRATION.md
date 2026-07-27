# Промпт барои frontend — гузариш аз SMS/телефон ба Email

> Ин файлро пурра нусхабардорӣ карда ба frontend бидиҳед.

---

Backend-и Omuz CRM пурра иваз шуд: **вуруд ба система акнун бо email аст, на бо рақами телефон**, ва ҳамаи паёмҳо (парол, коди тасдиқ) ба email мераванд, на ба SMS. Frontend-ро ба ин мутобиқ кун.

Ҳамаи тағйиротҳо дар backend аллакай тайёр ва санҷидашударо истифода бар — шаклҳои JSON дар поён аз сервери зинда гирифта шудаанд, тахминӣ нестанд.

## 0. Нақши `admin` → `mentor`

Дар система 4 нақш ҳаст. Нақши `admin` акнун **`mentor`** ном дорад:

| Пеш | Акнун |
|---|---|
| `director` | `director` — бетағйир |
| `superadmin` | `superadmin` — бетағйир |
| **`admin`** | **`mentor`** |
| `student` | `student` — бетағйир |

Ҳама ҷое, ки дар frontend сатри `"admin"` навишта шудааст (муқоисаи нақш, номи нақш дар UI, шартҳои `v-if`/`if`), ба `"mentor"` иваз кун.

⚠️ **`role.id`-ро hardcode накун.** Рӯйхати нақшҳоро аз `GET /api/roles` гир ва `id`-ро аз рӯи `name` ёб:
```js
const roles = await api.get("/api/roles");
const mentorRoleId = roles.find(r => r.name === "mentor").id;
```

Ҳудуди дастрасӣ (ҳамааш бо 182 санҷиш тасдиқ шудааст):

| Бахш | director | superadmin | mentor | student |
|---|---|---|---|---|
| Branches, Courses, Leads, Employees | ✅ | ✅ | ❌ | ❌ |
| **Timetable — дидан** (mentor танҳо дарсҳои ХУДаш) | ✅ | ✅ | ✅ | ❌ |
| Timetable — сохтан/тағйир/нест | ✅ | ✅ | ❌ | ❌ |
| Dashboard, Email | ✅ | ✅ | ❌ | ❌ |
| Users, Roles, Permissions, Logs | ✅ | ✅ | ❌ | ❌ |
| **Гурӯҳҳо — дидан** (list, :id, stats, schedule) | ✅ | ✅ | ✅ | ✅ |
| **Журнал** (ҳасту нест, балл) | ✅ | ✅ | ✅ | ❌ |
| Гурӯҳ — сохтан/тағйир/нест | ✅ | ✅ | ❌ | ❌ |
| **Донишҷӯ — дидан** (list, :id, activity, leaders) | ✅ | ✅ | ✅ | ❌ |
| Донишҷӯ — сохтан/тағйир/нест/enroll/invite | ✅ | ✅ | ❌ | ❌ |
| **Coin** (додан/харҷ/дидан) | ✅ | ✅ | ✅ | ❌ |
| Payments, Budget, Expenses, Debtors, Overview | ✅ | ✅ | ❌ | ❌ |
| **Ойлик** (salary, avans, accountant) | ✅ | ❌ | ❌ | ❌ |
| Notifications | ✅ | ✅ | ✅ | ✅ |
| `/students/me*` (профил/балл/coin-и худӣ) | ❌ | ❌ | ❌ | ✅ |

**mentor = муаллим.** Танҳо гурӯҳ/донишҷӯро мебинад, журнал менависад (ҳасту нест, балл)
ва coin медиҳад. Донишҷӯ илова карда наметавонад.

**student** ҳамаи гурӯҳҳоро мебинад, вале журнали онҳоро не — танҳо баллҳои
худашро аз `/students/me/scores`.

### ⚠️ Ойлик дар ҷавоб пинҳон мешавад

`/accounting/overview`, `/accounting/net` ва `/accounting/overview/chart` барои
**superadmin** майдонҳои ойликро БАР НАМЕГАРДОНАНД:

| Майдон | director | superadmin |
|---|---|---|
| `total_income`, `total_expenses`, `budget_*`, `total_debt*` | ✅ | ✅ |
| `total_salaries`, `total_avans`, `net` | ✅ | ❌ нест |
| chart: `salaries`, `avans` | ✅ | ❌ нест |

Пас дар UI ин майдонҳоро **шартан** нишон дод — `if (data.total_salaries !== undefined)`.
Вагарна барои superadmin `undefined` намоён мешавад.

### Кӣ киро сохта метавонад

| Созанда | Метавонад созад/нест кунад |
|---|---|
| **director** | superadmin, mentor, student |
| **superadmin** | mentor, student |
| mentor, student | ҳеҷ кас (ба `/api/users` дастрасӣ надоранд) |

Ҳеҷ кас нақши `director`-ро сохта наметавонад — он танҳо тавассути seed сохта мешавад.

### ❌ `PUT /users/:id/toggle-add-students` НЕСТ карда шуд

Endpoint `404` медиҳад ва майдони `can_add_students` аз ҷавоби `/api/users` нест шуд.
Онро аз frontend бароред.

### 🆕 `employee_id` — пайванди mentor ба корманд

Барои он ки mentor **ҷадвали дарсҳои ХУДашро** бинад, ҳисоби ӯ бояд ба сабти
`Employee` пайваст бошад — `TimetableEntry.mentor_id` ба `Employee` ишора мекунад, на ба `User`.

Ҳангоми сохтани mentor `employee_id` фиристед:
```
POST /api/users
{ "email": "muallim@gmail.com", "full_name": "Салим", "role_id": <mentor>, "employee_id": 7 }
```
Ё баъдтар: `PUT /api/users/:id { "employee_id": 7 }`

- `404` агар корманд набошад · `409` агар он корманд аллакай ҳисоб дошта бошад · `400` агар `employee_id` нодуруст бошад
- Агар пайваст **набошад**, `GET /api/timetable` барои mentor **рӯйхати холӣ** медиҳад (на хато)
- `?mentor_id=` барои mentor нодида гирифта мешавад — ӯ ҷадвали ҳамкорро дида наметавонад
- `GET /api/timetable/:id` барои дарси ҳамкор `404` медиҳад

Дар формаи сохтани mentor як майдони интихоби корманд гузоред (аз `GET /api/employees`).

## Он чи бояд НЕСТ карда шавад

1. **Ҳама ҷое, ки рақами телефон барои вуруд истифода мешавад** — майдони `phone` дар экрани login, маскаи рақам, тафтиши формати рақам ҳангоми вуруд.
2. **Ҳама чизи марбут ба SMS** — матнҳои «код ба рақами шумо фиристода шуд», иконкаҳои SMS, модули «SMS» дар меню, `/api/sms/*`.
3. **Экрани сабти ном (register)** агар бошад — `POST /auth/register` дар backend вуҷуд надорад ва бармегардонад 401. Ҳисоб танҳо аз ҷониби director/superadmin сохта мешавад.
4. **Майдони «парол» ҳангоми сохтани корбар** — сервер худаш пароли тасодуфӣ месозад ва ба email мефиристад.

`phone` дар система мемонад, вале **танҳо ҳамчун маълумоти алоқа** (дар профили донишҷӯ, корманд, лид). Он дигар логин нест.

---

## 1. Вуруд (Login)

```
POST /api/auth/login
Content-Type: application/json

{ "email": "salim@gmail.com", "password": "MyPass2026" }
```

Ҷавоби 200:
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "must_change_password": false,
  "user": {
    "id": 1,
    "email": "director@example.com",
    "phone": null,
    "full_name": "Director",
    "role_id": 4,
    "branch_id": null,
    "student_id": null,
    "can_add_students": true,
    "must_change_password": false,
    "created_at": "2026-07-26T21:34:20.121Z",
    "role": { "id": 4, "name": "director" }
  }
}
```

- `401` → `{ "message": "Email ё парол хато" }`
- `429` → аз ҳад зиёд кӯшиш (10 дар 15 дақиқа) — поён бинед

**Муҳим:** сервер email-ро худаш нормализа мекунад (фосилаҳоро мебарорад, хурдҳарф мекунад). Яъне `Salim@Gmail.COM` ва `salim@gmail.com` як ҳисобанд. Дар frontend лозим нест ин корро кунӣ, вале зарар ҳам надорад.

### `must_change_password` — экрани нав лозим аст

Агар дар ҷавоби login `must_change_password: true` бошад, **фавран ба экрани ивази парол бибар**. Ин ҳисобест, ки паролаш аз тарафи система сохта ва бо email фиристода шудааст.

То ивази парол ин корбар **ба ҳеҷ бахши система дастрасӣ надорад** — ҳар дархост ба `/api/*` (ба ҷуз `/api/auth/*`) чунин ҷавоб медиҳад:

```
403
{
  "message": "Аввал паролро иваз кунед",
  "must_change_password": true,
  "change_password_endpoint": "POST /api/auth/change-password"
}
```

Пас дар interceptor-и HTTP: агар `403` бо `must_change_password: true` омад → ба экрани ивази парол бибар.

Ивази парол:
```
POST /api/auth/change-password        (токен лозим)
{ "old_password": "...", "new_password": "..." }
```
- `400` агар парол камтар аз 8 аломат бошад
- `400` агар пароли нав ба кӯҳна баробар бошад
- `401` агар пароли кӯҳна хато бошад
- `200` → **корбар бояд аз нав ворид шавад** (токенҳои кӯҳна бекор мешаванд)

---

## 2. Барқарорсозии парол — акнун СЕ қадам

Пеш ду қадам буд. Акнун се қадам аст: коди 6-рақама → **reset_token** → пароли нав.

### Қадами 1 — фиристодани код

```
POST /api/auth/forgot-password
{ "email": "salim@gmail.com" }
```

Ҷавоб **ҳамеша 200**, новобаста аз он ки суроға дар система ҳаст ё не:
```json
{ "message": "Агар ин суроға дар система бошад, код фиристода шуд" }
```

⚠️ Ин қасдан чунин аст (бехатарӣ — то маълум нашавад кадом суроғаҳо сабтанд). Пас **дар frontend нанавис** «ин email ёфт нашуд» — сервер инро ҳеҷ гоҳ намегӯяд. Ба корбар бигӯ: «Агар ин суроға сабт бошад, код фиристода шуд — почтаи худро бинед».

Код **10 дақиқа** эътибор дорад.

### Қадами 2 — тафтиши код → reset_token

```
POST /api/auth/verify-reset-code
{ "email": "salim@gmail.com", "code": "036370" }
```

Муваффақ (200):
```json
{
  "success": true,
  "valid": true,
  "reset_token": "cad72af9173d3c080426f52ac55eb6f01eb0e36a58fe706c33bad70c4c28ccaf",
  "expires_in_minutes": 15
}
```

**`reset_token`-ро нигоҳ дор** — он барои қадами 3 лозим аст (дар state, на дар localStorage — 15 дақиқа зиндагӣ мекунад).

Коди хато (400):
```json
{ "message": "Код хато ё мӯҳлаташ гузаштааст", "attempts_left": 4 }
```

`attempts_left`-ро ба корбар нишон дод: «Код хато. 4 кӯшиш мондааст».

Пас аз **5 кӯшиши нодуруст** код тамоман бекор мешавад (400):
```json
{ "message": "Код 5 маротиба хато ворид шуд ва бекор карда шуд. Аз нав дархост кунед." }
```
Дар ин ҳолат корбарро ба қадами 1 баргардон.

### Қадами 3 — таъини пароли нав

```
POST /api/auth/reset-password
{ "reset_token": "cad72af9...", "new_password": "NewPass2026" }
```

⚠️ **`email` ва `code` дигар ба ин endpoint фиристода намешаванд** — танҳо `reset_token`.

- `200` → `{ "success": true, "message": "Парол иваз шуд. Бо парoли нав ворид шавед." }`
- `400` агар токен хато/мӯҳлаташ гузашта, ё парол камтар аз 8 аломат
- Токен **як бор** кор мекунад — такрори ҳамон дархост `400` медиҳад

Пас аз муваффақият корбарро ба экрани login бибар.

---

## 3. Сохтани ҳисоб (superadmin / mentor / student)

```
POST /api/users                       (токени director ё superadmin)
{
  "email": "salim@gmail.com",
  "full_name": "Салим Ҷӯраев",
  "role_id": 3,
  "phone": "931112233",     // ихтиёрӣ — танҳо барои алоқа
  "branch_id": 1            // ихтиёрӣ
}
```

**`password` нафирист** — сервер худаш пароли тасодуфии 10-аломата месозад ва ба email мефиристад.

Ҷавоби 201:
```json
{
  "id": 2,
  "email": "salim@gmail.com",
  "phone": "992931112233",
  "full_name": "Салим Ҷӯраев",
  "role_id": 3,
  "must_change_password": true,
  "created_at": "2026-07-26T21:34:28.076Z",
  "email_sent": true,
  "login_credentials": { "email": "salim@gmail.com", "password": "yrm4DjECGU" }
}
```

- `email_sent: true` → email рафт, ба корманд танҳо бигӯ «маълумот ба почтаи ӯ фиристода шуд»
- `email_sent: false` → email нарафт, дар ҷавоб `email_error` низ меояд. **Дар ин ҳолат `login_credentials`-ро дар экран нишон дод**, то корманд онро дастӣ диҳад
- `login_credentials.password` **танҳо ҳамин як бор** бармегардад — баъдтар дар база hash аст
- `400` агар email нодуруст бошад
- `409` агар email аллакай истифода шуда бошад
- `phone` худкор ба шакли `992XXXXXXXXX` меояд — инро дар UI ҳамчун `+992 93 111 22 33` нишон дод

Навсозӣ: `PUT /api/users/:id` — `{ email?, phone?, full_name?, role_id?, branch_id? }`

---

## 4. Ҳисоб барои донишҷӯ (Invite)

```
POST /api/students/:id/invite
{ "email": "farhod@mail.ru" }     // ихтиёрӣ, агар дар профил набошад
```

Ҷавоби 201:
```json
{
  "success": true,
  "login_credentials": {
    "email": "farhod@mail.ru",
    "password": "46MKdeayet",
    "email_sent": true
  }
}
```

- `400` агар донишҷӯ email надошта бошад → `"Ин донишҷӯ email надорад. Email-ро дар профил гузоред ё дар ҳамин дархост фиристед."`
  → Дар UI дар ин ҳолат майдони email нишон дод ва аз корбар пурс
- `409` агар бо ин email аллакай корбар бошад

**Дар формаи сохтани донишҷӯ email-ро майдони муҳим кун** — бе он донишҷӯ ба система ворид шуда наметавонад. `phone` то ҳол ҳатмист (барои алоқа).

---

## 5. Модули SMS → Email

Ҳамаи роҳҳо `/api/sms/*` → **`/api/email/*`**:

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

Дар меню «SMS» → «Email» ном гузор.

### Фиристодан

```
POST /api/email/send
{
  "recipient_type": "Student",        // Student | Employee | Graduate
  "recipient_ids": [1, 2, 3],         // ҳатман массиви ғайрихолӣ
  "subject": "Хабари муҳим",          // ихтиёрӣ, агар text истифода шавад
  "text": "Дарси фардо соати 18:00"
}
```
ё бо шаблон:
```
{ "recipient_type": "Student", "recipient_ids": [1], "template_id": 5 }
```

Ҷавоби 200:
```json
{
  "success": true,
  "sent_count": 3,
  "failed_count": 0,
  "recipients_count": 3,
  "mail_enabled": true
}
```

- `mail_enabled: false` → сервер дар режими тестӣ аст, паём **воқеан нарафт**. Инро дар UI огоҳӣ нишон дод: «Режими тестӣ — паём фиристода нашуд»
- `failed_count > 0` → як қисми паёмҳо нарасид, ба корбар бигӯ
- `400` агар `recipient_ids` холӣ ё нест бошад
- `404` агар ҳеҷ яке аз ретсипиентҳо email надошта бошад

**Муҳим:** `recipient_type: "Lead"` дигар кор намекунад (`400`) — лидҳо дар система email надоранд.

### Ретсипиентҳо

`GET /api/email/recipients/*` акнун **танҳо онҳое, ки email доранд** бармегардонад:
```json
[{ "id": 1, "full_name": "Фарҳод Каримов", "email": "farhod@mail.ru" }]
```
(пеш `phone` буд, акнун `email`)

Ин маънои онро дорад, ки дар рӯйхати интихоб донишҷӯёни бе email намоён намешаванд. Агар корбар ҳайрон шавад «чаро ин донишҷӯ нест?» — дар UI эзоҳ гузор: «танҳо онҳое, ки email доранд».

---

## 6. Logout

```
POST /api/auth/logout        (токен ҲАТМӢ, body лозим нест)
```
Пеш `{ user_id }` дар body мерафт ва токен лозим набуд — акнун баръакс.

---

## 7. Ду чизи умумӣ, ки ҳама ҷо бояд коркард шавад

### `429 Too Many Requests`

Route-ҳои кушода маҳдудият доранд:
- `login` — 10 дар 15 дақиқа
- `forgot-password` — **5 дар 1 соат**
- `verify-reset-code` / `reset-password` — 10 дар 15 дақиқа

Ҷавоб:
```json
{ "message": "Дархостҳо аз ҳад зиёданд. Каме сонитар кӯшиш кунед.", "retry_after_seconds": 3600 }
```
Header-и `Retry-After` низ меояд. Дар UI вақти интизориро нишон дод.

### `limit` дар пагинация

`?limit=` акнун ба **200** маҳдуд аст. Агар `?limit=1000` фиристӣ, сервер 200 медиҳад ва дар `meta.limit` 200 менависад. Агар дар ҷое `limit=500` истифода мешуд, ба pagination-и воқеӣ гузар.

---

## Ҷамъбасти рӯйхати корҳо

- [ ] Экрани login: `phone` → `email`
- [ ] Экрани нави «Ивази парол» + interceptor барои `403 must_change_password`
- [ ] Занҷири forgot-password: се қадам, нигоҳ доштани `reset_token`, нишон додани `attempts_left`
- [ ] `reset-password` акнун `{ reset_token, new_password }` мефиристад
- [ ] Формаи сохтани корбар: `phone` → `email`, майдони парол нест кун, `login_credentials` нишон дод агар `email_sent: false`
- [ ] Формаи донишҷӯ: email майдони муҳим
- [ ] `/api/sms/*` → `/api/email/*` дар ҳама ҷо, меню «SMS» → «Email»
- [ ] `recipient_type: Lead` нест кун
- [ ] Ретсипиентҳо `phone` → `email`
- [ ] `logout` бо токен, бе body
- [ ] Коркарди `429` бо `retry_after_seconds`
- [ ] `limit` ≤ 200
- [ ] Ҳамаи матнҳои «SMS», «рақами телефон» дар контексти вуруд → «email»
- [ ] Нақши `"admin"` → `"mentor"` дар ҳама ҷо; `role.id`-ро аз `GET /api/roles` гир, hardcode накун
