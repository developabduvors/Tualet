# Toilet Finder — Backend

Express + Prisma + SQLite + Socket.io API. Bu hujjat backend papkasida **hozirgi paytda nima borligini** sanab beradi.

> Loyiha umumiy tavsifi va frontend-mos API ma'lumotnomasi uchun: ildizdagi `PROJECT_SUMMARY.md`.
> Texnik konvensiyalar uchun: ildizdagi `CLAUDE.md`.

---

## Texnologiyalar

- **Node 20+**, CommonJS (`"type": "commonjs"`)
- **Express 4** — REST API
- **Prisma 6** + **SQLite** (`prisma/dev.db`)
- **Socket.io 4** — realtime chat
- **jsonwebtoken** — JWT
- **dotenv**, **cors**, **nodemon** (dev)

Parol uchun **bcrypt o'rnatilmagan** — Node-ning native `crypto.scryptSync` ishlatiladi.

---

## Buyruqlar (`cd backend`)

```bash
npm install              # bog'liqliklarni o'rnatish
npm run dev              # nodemon, http://localhost:5000
npm start                # production-style ishga tushirish
npm run prisma:generate  # schema o'zgartirilgandan keyin
npm run prisma:migrate   # yangi migratsiyani qo'llash
```

Test runner **o'rnatilmagan** — `npm test` mavjud emas.

---

## Muhit o'zgaruvchilari (`backend/.env`)

| Kalit | Majburiy | Tavsif |
|---|---|---|
| `DATABASE_URL` | ✅ | Absolyut SQLite yo'l, masalan `file:C:/Users/admin/Desktop/Toilet/backend/prisma/dev.db`. Windows'da nisbiy yo'l Prisma'ni buzadi. |
| `JWT_SECRET` | ✅ | `utils/jwt.js` va `middlewares/authMiddleware.js` o'qiydi. |
| `PORT` | ❌ | Standart `5000`. |

---

## Papka tuzilishi

```text
backend/
├── prisma/
│   ├── schema.prisma     # User, Toilet, Review modellari
│   ├── dev.db            # SQLite ma'lumotlar bazasi (committed)
│   └── migrations/       # Prisma migratsiyalari
├── src/
│   ├── config/
│   │   └── prisma.js                   # PrismaClient singleton
│   ├── controllers/
│   │   ├── authController.js           # register, login, getMe
│   │   ├── toiletController.js         # CRUD + nearby
│   │   ├── reviewController.js         # upsert, delete, list
│   │   └── adminController.js          # users, stats, deleteUser
│   ├── middlewares/
│   │   └── authMiddleware.js           # authenticateToken, authorizeRoles
│   ├── routes/
│   │   ├── authRoutes.js               # /api/auth
│   │   ├── toiletRoutes.js             # /api/toilets
│   │   ├── reviewRoutes.js             # /api/reviews
│   │   └── adminRoutes.js              # /api/admin (faqat ADMIN)
│   ├── utils/
│   │   ├── jwt.js                      # generateToken
│   │   ├── password.js                 # scrypt + timingSafeEqual
│   │   ├── haversine.js                # getDistanceInKm
│   │   ├── ratings.js                  # recalculateToiletRating
│   │   └── serializers.js              # formatToilet, formatReview, sanitizeUser
│   ├── app.js                          # Express ilovasi (route mount + xato handler)
│   └── server.js                       # http + Socket.io ishga tushirish
├── package.json
└── .env                                # maxfiy sozlamalar
```

---

## Ma'lumotlar bazasi (Prisma)

**3 ta model**, SQLite. Schema: `prisma/schema.prisma`.

### `User`
- `id`, `name`, `phone @unique`, `password` (`"salt:hash"` formatida), `role` (`String`, default `"USER"`).
- 1-N: `toilets`, `reviews`.

### `Toilet` (`@@map("toilets")`)
- `id`, `ownerId` (FK → User, cascade delete), `name`, `lat`, `lng`, `price`, `status`, `type`, `images` (JSON-string), `avg_rating`.
- Indekslar: `@@index([lat, lng])` (yaqinlik qidiruvi uchun), `@@index([status])`.

### `Review` (`@@map("reviews")`)
- `id`, `userId`, `toiletId`, `rating` (1–5), `comment`, `quick_feedback` (JSON-string).
- `@@unique([userId, toiletId])` — bir foydalanuvchi bir hojatxonaga **bitta** sharh.
- `@@index([toiletId])`.

> ⚠️ Schema'da `enum` deklaratsiyalar bor, lekin SQLite enumlarni qo'llab-quvvatlamaydi — qiymatlar `String` sifatida saqlanadi va validatsiya controllerlarda (`String(value).toUpperCase()`).

---

## API endpointlari

> **Belgilarning ma'nosi:**
> - **Auth ustuni** — `✅` = JWT token majburiy (`Authorization: Bearer ...`); `—` = ochiq endpoint.
> - **Rol ustuni** — `OWNER` / `USER` / `ADMIN` / `egasi` = ruxsat etilgan rol(lar); `—` = rol cheklovi yo'q.
> - Barcha qatorlardagi endpointlar **allaqachon implementatsiya qilingan va ishlaydi** — bu hujjat hozirgi holatni tasvirlaydi, TODO emas.

| Yo'l | Metod | Auth | Rol | Funksiya |
|---|---|---|---|---|
| `/api/health` | GET | — | — | Tirik tekshiruvi |
| `/api/auth/register` | POST | — | — | Ro'yxatdan o'tish (access + refresh token qaytaradi) |
| `/api/auth/login` | POST | — | — | Kirish (access + refresh token qaytaradi) |
| `/api/auth/refresh` | POST | — | — | Refresh tokendan yangi access + refresh juftlik |
| `/api/auth/me` | GET | ✅ | — | Joriy foydalanuvchi |
| `/api/toilets` | GET | — | — | Hammasi (filter: `status`, `ownerId`) |
| `/api/toilets/nearby` | GET | — | — | Yaqin atrofdagilar (lat, lng, radius, type, maxPrice, minRating, limit) |
| `/api/toilets/:id` | GET | — | — | Bittasi + owner |
| `/api/toilets` | POST | ✅ | OWNER | Qo'shish |
| `/api/toilets/:id` | PUT | ✅ | egasi | Yangilash |
| `/api/toilets/:id` | DELETE | ✅ | egasi | O'chirish |
| `/api/reviews/toilet/:toiletId` | GET | — | — | Sharhlar |
| `/api/reviews` | POST | ✅ | USER | Sharh upsert |
| `/api/reviews/:id` | DELETE | ✅ | egasi/ADMIN | Sharhni o'chirish |
| `/api/admin/users` | GET | ✅ | ADMIN | Foydalanuvchilar |
| `/api/admin/users/:id` | DELETE | ✅ | ADMIN | Foydalanuvchini o'chirish (cascade + rating qayta hisob) |
| `/api/admin/stats` | GET | ✅ | ADMIN | `{ users, toilets, reviews }` sonlari |

**Javob shakli (har doim):** `{ success, message?, data?, count? }`.

---

## Realtime (Socket.io)

`server.js` ichida (alohida modul emas). Eventlar:

| Event | Yo'nalish | Payload |
|---|---|---|
| `join_personal_room` | client → server | `userId` (Number) |
| `send_message` | client → server | `{ senderId, receiverId, text }` |
| `receive_message` | server → client | `{ senderId, receiverId, text, sentAt }` |

**Persistlik yo'q** — xabarlar DB'ga yozilmaydi.

---

## Asosiy patternlar

### Auth (scrypt, bcrypt emas)
- `utils/password.js` → `crypto.scryptSync` + `"salt:hash"` format.
- `comparePassword` → `crypto.timingSafeEqual` (timing-attack himoyasi).
- ⚠️ `bcrypt`'ga ko'chirish hozirgi qatorlarni buzadi — migratsiyasiz qilmang.

### JWT — access + refresh token
`utils/jwt.js` ikki turdagi token chiqaradi (bitta `JWT_SECRET`, payloaddagi `type` field bilan farqlanadi):

| Token | Expiry | Payload | Maqsad |
|---|---|---|---|
| Access | `15m` | `{ id, phone, role, type: 'access' }` | Har bir himoyalangan so'rovda `Authorization: Bearer ...` |
| Refresh | `7d` | `{ id, type: 'refresh' }` | Faqat `POST /api/auth/refresh` ga yuboriladi |

**Oqim:**
1. `register` / `login` → `{ accessToken, refreshToken, data }` qaytaradi.
2. Access token muddati tugagach (`401`), frontend `POST /auth/refresh` ga `{ refreshToken }` yuboradi.
3. Backend foydalanuvchini DB'dan **qayta o'qiydi** (rol o'zgargan bo'lsa, yangi access token yangi rol bilan chiqadi) va **yangi juftlik** qaytaradi.
4. Refresh token muddati tugagan/yaroqsiz bo'lsa → `401` → frontend logout qiladi.

**Xavfsizlik:**
- `authMiddleware.authenticateToken` `decoded.type === 'refresh'` bo'lsa rad qiladi — refresh tokenni access sifatida ishlatib bo'lmaydi.
- Refresh tokenda `role`/`phone` yo'q (ataylab) — refresh paytida DB'dan qayta o'qib olinadi.
- Token revocation jadvali **yo'q** — refresh tokenni bekor qilish kerak bo'lsa, `JWT_SECRET` ni o'zgartirish hammani logout qiladi.

### Nearby qidiruv (ikki bosqich)
1. **SQL bounding-box** — `[lat, lng]` indeks orqali tezkor prefilter.
2. **Haversine** — `utils/haversine.js` aniq aylana masofa, `<= radius` filtr, `distance` bo'yicha tartiblash, `limit` kesish.

`cosLat > 0.01` tekshiruvi — qutbga yaqin koordinatalarda divide-by-zero himoyasi.

### `avg_rating` denormalizatsiya
`Toilet.avg_rating` qo'lda yangilanadi. **Hech qachon to'g'ridan-to'g'ri yozmang** — `utils/ratings.js#recalculateToiletRating(tx, toiletId)` ni `prisma.$transaction` ichida chaqiring.

Chaqirilish joylari:
- `reviewController.createReview` — upsert dan keyin.
- `reviewController.deleteReview` — delete dan keyin.
- `adminController.deleteUser` — **snapshot-before-cascade** patterni: cascade User'ni o'chirgunga qadar ta'sir qilingan `toiletId`-lar ro'yxati saqlanadi, keyin har biri qayta hisoblanadi.

### Xato boshqaruvi
Hamma controller `try { ... } catch (error) { next(error); }`. `app.js` oxiridagi handler `{ success: false, message }` qaytaradi.

---

## So'nggi backend commitlari

- `78ee933` — nearby filtrlari (`type`, `maxPrice`, `minRating`) va `avg_rating` qayta hisoblash tuzatishlari
- `a4a3d6c` — `abduvoris` branch ochilishi
- `f6a99a0` — backend skeletining birinchi versiyasi
