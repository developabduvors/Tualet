# Admin panel — dizayn spetsifikatsiyasi

**Sana:** 2026-05-09
**Mavzu:** Toilet Finder loyihasiga admin panel qo'shish
**Holat:** Tasdiqlangan, implementatsiya planiga tayyor

## Maqsad

Toilet Finder backend va frontend'iga **kontent moderatsiyasi** uchun admin panel qo'shish. Admin har qanday hojatxonani edit/o'chira oladi va har qanday sharhni o'chira oladi. Admin auth tizimi mavjud foydalanuvchi tizimidan **butunlay ajratilgan** — alohida login formasi, alohida JWT secret, alohida frontend context.

## Asosiy qarorlar

| Qaror | Tanlov | Sabab |
|---|---|---|
| Xususiyatlar | Hojatxonalar global boshqaruvi + sharhlar moderatsiyasi | Foydalanuvchi sonini ko'paytirish yoki rol o'zgartirish kerak emas (YAGNI). |
| Auth modeli | Standalone (User jadvalidan ajratilgan) | Admin = oddiy foydalanuvchi emas. ADMIN role User jadvalida bo'lmaydi. |
| Saqlash | Yangi `AdminCredential` Prisma jadvali | Bir nechta adminga moslashish, parol o'zgartirishga imkon. |
| Bootstrap | `prisma/seed.js` `.env`'dan o'qiydi | Idempotent, deploy-friendly. |
| Token modeli | Access (15m) + refresh (7d) | Foydalanuvchi sxemasi bilan konsistentlik. |
| Izolyatsiya | Alohida `ADMIN_JWT_SECRET` | Privilege chegarasi kod darajasida ajratiladi. |

## Arxitektura

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  Frontend               │         │  Backend                 │
│                         │         │                          │
│  /          (public)    │  user   │  /api/auth/*             │
│  /login     (user)      │ ──JWT──►│  /api/toilets/*          │
│  /admin/login  (admin)  │         │  /api/reviews/*          │
│  /admin     (admin)     │ ─admin─►│  /api/admin/*            │
│                         │  JWT    │                          │
│  AuthContext (user)     │         │  authMiddleware     ◄─JWT│
│  AdminAuthContext (NEW) │         │  adminAuthMiddleware NEW │
└─────────────────────────┘         └──────────────────────────┘
                                          │
                                          ▼
                                    SQLite + Prisma
                                    ├─ User (USER, OWNER)
                                    ├─ Toilet
                                    ├─ Review
                                    └─ AdminCredential ◄── NEW
```

## Database

### Yangi model — `AdminCredential`

`backend/prisma/schema.prisma`:

```prisma
model AdminCredential {
  id         Int      @id @default(autoincrement())
  username   String   @unique
  password   String   // "salt:hash" format, scrypt
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("admin_credentials")
}
```

### `User` modelida o'zgarish

Hech qanday struktura o'zgarishi yo'q — `role` allaqachon `String` saqlangan. Lekin enum izohi yangilanadi: ADMIN endi User'ning roli emas, AdminCredential alohida tizim. Hech qanday DB qiymat migratsiyasi shart emas (hech kim hozir `role='ADMIN'` emas).

### Migratsiya

- Nomi: `20260509_add_admin_credentials`
- Yagona o'zgarish: `admin_credentials` jadvali yaratiladi.

## Backend

### Yangi fayllar

```text
backend/
├── prisma/
│   └── seed.js                           ← admin'ni .env'dan yaratadi
└── src/
    ├── controllers/
    │   ├── adminAuthController.js        ← login, refresh, me
    │   └── adminController.js            ← toilet/review moderatsiyasi
    ├── middlewares/
    │   └── adminAuthMiddleware.js        ← admin JWT verify
    ├── routes/
    │   └── adminRoutes.js                ← /api/admin/* mount
    └── utils/
        ├── adminJwt.js                   ← alohida secret bilan
        └── toiletValidation.js           ← user/admin controller'lar uchun umumiy validatsiya
```

### Endpoint to'plami (`/api/admin/*`)

| Yo'l | Metod | Auth | Funksiya |
|---|---|---|---|
| `/api/admin/auth/login` | POST | — | `{ username, password }` → `{ accessToken, refreshToken }` |
| `/api/admin/auth/refresh` | POST | — | `{ refreshToken }` → yangi juftlik |
| `/api/admin/auth/me` | GET | admin JWT | `{ id, username }` |
| `/api/admin/toilets/:id` | DELETE | admin JWT | Har qanday hojatxonani o'chirish |
| `/api/admin/toilets/:id` | PUT | admin JWT | Har qanday hojatxonani edit qilish |
| `/api/admin/reviews` | GET | admin JWT | Hamma sharhlar (sahifalash: `?page=1&limit=50`, sort `createdAt desc`, include user+toilet) |
| `/api/admin/reviews/:id` | DELETE | admin JWT | Har qanday sharhni o'chirish |

> **Diqqat:** admin alohida list endpoint'lari (`GET /api/admin/toilets`) **yo'q** — admin frontend'i mavjud public `GET /api/toilets` ni qayta ishlatadi. Faqat write/delete uchun yangi route'lar.

### `adminJwt.js`

```js
const ADMIN_ACCESS_EXPIRY = '15m';
const ADMIN_REFRESH_EXPIRY = '7d';
// process.env.ADMIN_JWT_SECRET — alohida, JWT_SECRET dan farq qiladi

generateAdminTokens({ id, username })
  → { accessToken, refreshToken }

verifyAdminToken(token)
  → decoded yoki throw
```

Token payload'lari:
- Access: `{ id, username, type: 'admin_access', iat, exp }`
- Refresh: `{ id, type: 'admin_refresh', iat, exp }` — username DB'dan qayta o'qiladi

### `adminAuthMiddleware.js`

- Bearer token olinadi.
- `ADMIN_JWT_SECRET` bilan verify qilinadi (alohida secret bo'lgani uchun foydalanuvchi tokeni umuman verify bo'lmaydi).
- `decoded.type === 'admin_access'` tekshiriladi (refresh token ishlatib bo'lmaydi).
- **DB lookup**: `prisma.adminCredential.findUnique({ where: { id: decoded.id } })`. Mavjud bo'lmasa 401. Bu admin o'chirilganida sessiyalarni darhol bekor qiladi.
- `req.admin = { id, username }` o'rnatiladi.

> **Sabab — DB lookup nima uchun?** Admin = yuqori privilege. Agar admin o'chirilsa, mavjud token darhol bekor bo'lishi kerak. User middleware'da bu yo'q chunki user privilege past va perf muhim. Admin so'rovlari kam — perf ahamiyatsiz.

### Controller mantiqi

**`adminAuthController.js`:**
- `login(req, res)` — `username` + `password`, `comparePassword` (timingSafeEqual), `generateAdminTokens`, qaytaradi.
- `refresh(req, res)` — refresh tokenni verify qiladi, type `admin_refresh` ekanini tekshiradi, DB'dan adminni o'qiydi (yo'q bo'lsa 401), yangi juftlik qaytaradi.
- `me(req, res)` — `req.admin` ni qaytaradi.

**`adminController.js`:**
- `deleteToilet(id)` — `prisma.toilet.delete({ where: { id } })`. Schema'da `Review.toilet` cascade delete bor — sharhlar avtomatik o'chadi. Owner check **yo'q**.
- `updateToilet(id, body)` — owner check'siz, `utils/toiletValidation.js` orqali umumiy validatsiya. Mavjud `toiletController.updateToilet` ham shu utility'ni ishlatadigan qilib refactor qilinadi.
- `deleteReview(id)` — `prisma.$transaction` ichida review'ni o'chiradi va `recalculateToiletRating(tx, toiletId)` chaqiradi (xuddi `reviewController.deleteReview` kabi).
- `listReviews({ page, limit })` — `prisma.review.findMany` + `include: { user: { select: { id, name } }, toilet: { select: { id, name } } }` + `orderBy: { createdAt: 'desc' }`. Total count'ni qaytaradi (sahifalash uchun).

### Mavjud kodga o'zgarishlar

- `app.js` — `/api/admin` mount qo'shiladi.
- `controllers/toiletController.js` — `updateToilet` validatsiyasi `utils/toiletValidation.js` ga olib chiqiladi (DRY).
- `controllers/authController.js` — o'zgarishsiz (`ALLOWED_ROLES = ['USER', 'OWNER']` qoladi).
- `package.json` — yangi script: `"db:seed": "node prisma/seed.js"`.

### Seed skripti (`backend/prisma/seed.js`)

Pseudokod:

```js
const prisma = require('../src/config/prisma');
const { hashPassword } = require('../src/utils/password');

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error('ADMIN_USERNAME va ADMIN_PASSWORD env kerak');
  }

  const existing = await prisma.adminCredential.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin "${username}" allaqachon mavjud — o'tkazib yuborildi.`);
    return;
  }

  const hash = hashPassword(password);
  await prisma.adminCredential.create({
    data: { username, password: hash }
  });
  console.log(`Admin "${username}" yaratildi.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

### Yangi env o'zgaruvchilari (`backend/.env`)

```bash
# Mavjud
DATABASE_URL=...
JWT_SECRET=...
PORT=5000

# YANGI
ADMIN_JWT_SECRET=<random 32+ char>     # foydalanuvchidan alohida
ADMIN_USERNAME=admin                   # seed paytida yaratiladi
ADMIN_PASSWORD=<plain text>            # faqat seed paytida o'qiladi
```

## Frontend

### Yangi fayllar

```text
frontend/src/
├── context/AdminAuthContext.jsx       ← admin sessiyasi (alohida)
├── lib/adminApi.js                    ← admin uchun fetch wrapper
├── components/
│   ├── AdminLayout.jsx                ← admin navbar bilan layout
│   └── AdminProtectedRoute.jsx        ← admin yo'q bo'lsa /admin/login ga
└── pages/admin/
    ├── AdminLoginPage.jsx
    ├── AdminDashboardPage.jsx
    ├── AdminToiletsPage.jsx
    └── AdminReviewsPage.jsx
```

### Provider iyerarxiyasi (`App.jsx`)

```
<BrowserRouter>
  <AuthProvider>              ← oddiy user
    <AdminAuthProvider>       ← NEW (mustaqil, lekin ichkarida joylashtiriladi)
      <SocketProvider>
        <AppRoutes/>
```

`SocketProvider` faqat `useAuth().user` ga bog'liq — admin context'iga aloqasi yo'q.

### Routing

```jsx
<Routes>
  {/* User routes — Layout */}
  <Route element={<Layout/>}>
    <Route path="/" element={<DashboardPage/>}/>
    {/* mavjud route'lar */}
  </Route>

  {/* Admin login — layoutsiz */}
  <Route path="/admin/login" element={<AdminLoginPage/>}/>

  {/* Admin protected — AdminLayout */}
  <Route element={<AdminProtectedRoute><AdminLayout/></AdminProtectedRoute>}>
    <Route path="/admin" element={<AdminDashboardPage/>}/>
    <Route path="/admin/toilets" element={<AdminToiletsPage/>}/>
    <Route path="/admin/reviews" element={<AdminReviewsPage/>}/>
  </Route>
</Routes>
```

### `AdminAuthContext`

`AuthContext` shaklida, lekin **alohida storage**:
- `localStorage` kalitlari: `toilet_finder_admin_access_token`, `toilet_finder_admin_refresh_token`
- State: `admin` (`{ id, username }` yoki `null`), `accessToken`, `loading`
- Metodlar: `adminLogin(accessToken, refreshToken)`, `adminLogout()`
- `accessToken` o'zgarsa `useEffect` `/admin/auth/me` ni qayta yuklaydi.

### `lib/adminApi.js`

`lib/api.js` bilan deyarli bir xil oqim, lekin:
- `Authorization` header **admin access token**ni o'qiydi.
- `401` kelsa, `tryAdminRefresh()` orqali `POST /admin/auth/refresh` ga refresh token yuboriladi.
- Refresh ham muvaffaqiyatsiz bo'lsa → admin tokenlari tozalanadi va **`/admin/login` ga** redirect (foydalanuvchi `/login` ga emas).
- Eksport: `adminRequest`, `setAdminTokens`, `clearAdminTokens`, `getAdminAccessToken`.

> **Muhim izolyatsiya:** oddiy `request` (foydalanuvchi) admin token bilan ishlamaydi va aksincha. Bu ataylab.

### Sahifa harakatlari

**`AdminLoginPage`** — `username` + `password` form, `POST /api/admin/auth/login`. Muvaffaqiyatda → `/admin`.

**`AdminDashboardPage`** — sodda kartochkalar:
- "Hojatxonalar (X ta)" → `/admin/toilets` ga link
- "Sharhlar (Y ta)" → `/admin/reviews` ga link
- Counts: hojatxonalar `GET /api/toilets`'dan, sharhlar `GET /api/admin/reviews?limit=1` (total field).

**`AdminToiletsPage`** — `GET /api/toilets` dan jadval. Har qator: nom, owner, status, narx, reyting, "Edit", "O'chirish". Filter: status, qidiruv (nom/owner). Edit `PUT /api/admin/toilets/:id`, delete `DELETE /api/admin/toilets/:id`.

**`AdminReviewsPage`** — `GET /api/admin/reviews?page=N&limit=50` dan jadval. Har qator: user (ism), hojatxona (nomi → link), reyting, comment, sana, "O'chirish". Sahifalash (Prev/Next).

### `AdminLayout`

Sodda navbar: brand "Admin Panel" + linklar (Dashboard / Toilets / Reviews) + Logout tugmasi. Mavjud foydalanuvchi `Layout`'iga tegmaydi.

## Hujjatlashtirish

- **`backend/README.md`**:
  - Env jadvaliga `ADMIN_JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` qo'shish.
  - "Buyruqlar"ga `npm run db:seed` qo'shish.
  - "API endpointlari" jadvaliga `/api/admin/*` ro'yxati qo'shish (admin auth ustuni: `🔒 ADMIN`).
  - "Asosiy patternlar"ga "Admin auth (alohida tizim)" bo'limi.

- **`frontend/README.md`**:
  - "Backend manzili" jadvaliga `lib/adminApi.js` qo'shish.
  - "Routing" jadvaliga 4 ta admin route qo'shish.
  - "State management"ga "AdminAuthContext (alohida)" bo'limi.

- **`CLAUDE.md`**:
  - "Auth model" bo'limi: admin auth alohida (yangi paragraph).
  - "ALLOWED_ROLES" eslatmasi: ADMIN endi User'ning roli emas.
  - "Backend request flow"da `/api/admin` mount qaytadan eslatiladi.

## Migratsiya rejasi

1. `cd backend && npm install` — yangi dependency yo'q, lekin tekshirish.
2. `npm run prisma:migrate` — `admin_credentials` jadvali yaratiladi.
3. `.env`'ga 3 ta yangi o'zgaruvchi qo'shiladi.
4. `npm run db:seed` — admin yaratiladi.
5. `npm run dev` — server qayta ishga tushadi.
6. Frontend: `cd frontend && npm run dev` — `/admin/login` ga kirish.

## Test rejasi (manual — test runner yo'q)

1. `npm run db:seed` qayta chaqirish — idempotent: "allaqachon mavjud" deyishi kerak.
2. `POST /api/admin/auth/login` to'g'ri parol bilan → `200 { accessToken, refreshToken }`.
3. Noto'g'ri parol bilan → `401`.
4. Admin token bilan `DELETE /api/toilets/:id` (oddiy user route) urinish → **401** (boshqa secret).
5. Foydalanuvchi token bilan `DELETE /api/admin/toilets/:id` urinish → **401** (aksincha).
6. Admin login → `/admin/toilets` ga kirish → boshqa userning hojatxonasini o'chirish → muvaffaqiyat.
7. `recalculateToiletRating` admin sharh o'chirgandan keyin chaqirilishini tekshirish (toilet `avg_rating` yangilanadi).
8. Refresh token oqimi: 15 daqiqadan ortiq kutish (yoki tokenni qo'lda noto'g'ri qilish), refresh chaqirish → yangi juftlik.
9. Frontend: admin va oddiy user bir vaqtda bir browserda kirish (alohida storage'lar) — ikkalasi ham normal ishlashini tekshirish.

## Doiradan tashqari (kelajak ishi)

Quyidagilar bu spec'ga **kirmaydi** — agar kerak bo'lsa, alohida iteratsiyada qo'shiladi:

- Foydalanuvchilarni boshqarish (list, edit, delete)
- Rol o'zgartirish UI (`USER` ↔ `OWNER`)
- Admin parolini o'zgartirish endpoint'i
- Bir nechta admin yaratish UI (DB'da qo'lda yoki seed qayta chaqirish bilan mumkin)
- Audit log (kim nima o'chirgani)
- Rate limiting admin login'da
- Kengaytirilgan analitika (o'sish grafigi, top joylar)
- Token revocation jadvali

## Xavfsizlik mulohazalari

- **Privilege ajratish**: alohida `ADMIN_JWT_SECRET` orqali admin va user tokenlari kriptografik jihatdan ajratilgan. Bir tokenni boshqasi sifatida ishlatib bo'lmaydi.
- **DB lookup har so'rovda**: o'chirilgan admin sessiyasi darhol bekor bo'ladi.
- **`.env` ga `ADMIN_PASSWORD` ochiq**: faqat seed paytida o'qiladi va darhol scrypt hash qilinadi. Production'da `.env`'ni VCS'ga commit qilmaslik kerak (allaqachon `.gitignore`'da).
- **Refresh token revocation yo'q**: `ADMIN_JWT_SECRET`'ni o'zgartirish hamma admin sessiyalarini bekor qiladi (nuclear option).
- **Type confusion**: payload'da `type: 'admin_access'` va alohida secret — ikki qavat himoya. Alohida secret bo'lmaganida ham, type tekshiruvi bo'lardi; alohida secret birinchi qavat bo'lib xizmat qiladi.
