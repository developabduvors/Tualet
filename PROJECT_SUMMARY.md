# Toilet Finder (Luxury Rest) - Loyiha Xulosasi

Ushbu hujjat loyihada amalga oshirilgan ishlar, loyiha tuzilishi va kelajakdagi rejalar haqida ma'lumot beradi.

## ✅ Amalga oshirilgan ishlar

### Backend (Express + Prisma + SQLite)
- **Ma'lumotlar bazasi**: PostgreSQL-dan SQLite-ga o'tildi (lokal ishlab chiqishni osonlashtirish uchun).
- **Auth Tizimi**: JWT orqali login/register va `GET /me` (joriy foydalanuvchi) endpointlari yaratildi.
- **Toilet CRUD**: Hojatxonalarni qo'shish, ko'rish, yangilash va o'chirish funksiyalari (Owner-only himoyasi bilan).
- **Reviews**: Hojatxonalarga sharhlar qoldirish va ularni o'qish tizimi.
- **Private Chat**: Socket.io "rooms" yordamida foydalanuvchi va ega (owner) o'rtasida shaxsiy muloqot tizimi.
- **Admin Panel**: Super Admin uchun statistikalar va foydalanuvchilarni boshqarish endpointlari.

### Frontend (React + Tailwind 4 + DaisyUI 5)
- **Arxitektura**: Monolitik `App.jsx` fayli `react-router-dom` yordamida alohida sahifalarga va komponentlarga bo'lindi.
- **Modern UI**: Tailwind CSS 4 va DaisyUI 5 yordamida "Luxury Rest" premium dizayni yaratildi.
- **Global State**: `AuthContext` va `SocketContext` yordamida autentifikatsiya va chat holatlari global boshqaruvga o'tkazildi.
- **Sahifalar**:
  - `Dashboard`: Qidiruv va hojatxonalar ro'yxati.
  - `Login/Register`: Zamonaviy formalar.
  - `Detail`: To'liq ma'lumot, sharhlar va integratsiyalashgan chat.
  - `Create/Edit`: Hojatxona egalari uchun boshqaruv paneli.

---

## 📂 Loyiha Strukturasi

```text
Toilet/
├── backend/
│   ├── prisma/            # Ma'lumotlar bazasi sxemasi va SQLite fayli
│   ├── src/
│   │   ├── config/        # Prisma va boshqa sozlamalar
│   │   ├── controllers/   # API mantiqi (Auth, Toilet, Review, Admin)
│   │   ├── middlewares/   # JWT va Rol tekshiruvi
│   │   ├── routes/        # API yo'nalishlari
│   │   ├── utils/         # Yordamchi funksiyalar (Haversine, Password)
│   │   ├── app.js         # Express ilovasi
│   │   └── server.js      # Serverni ishga tushirish (Socket.io bilan)
│   └── .env               # Maxfiy sozlamalar
├── frontend/
│   ├── src/
│   │   ├── components/    # Umumiy UI komponentlar (Layout)
│   │   ├── context/       # Auth va Socket Context
│   │   ├── lib/           # API fetch utilitasi
│   │   ├── pages/         # Sahifa komponentlari
│   │   ├── App.jsx        # Asosiy Routing
│   │   ├── index.css      # Tailwind 4 stillari
│   │   └── main.jsx       # Kirish nuqtasi
│   └── vite.config.js     # Vite sozlamalari
└── PROJECT_SUMMARY.md     # Ushbu hujjat
```

---

## 📡 Backend API ma'lumotnomasi (Frontendchilar uchun)

> **Base URL**: `http://localhost:5000/api` &nbsp;&nbsp; **Realtime**: `http://localhost:5000` (Socket.io)

### Asosiy konvensiyalar

**Javob shakli (har doim bir xil):**
```json
{ "success": true, "message": "...", "data": ..., "count": 10 }
```
Xatolarda: `{ "success": false, "message": "..." }` + tegishli HTTP status (`400`/`401`/`403`/`404`/`409`/`500`).

**Autentifikatsiya:**
- Token `localStorage.toilet_finder_token` da saqlanadi.
- Har bir himoyalangan so'rovda header: `Authorization: Bearer <token>`.
- Token ichida: `{ id, phone, role }`. Muddati tugasa — `401` qaytadi, frontend `logout()` qilish kerak.
- Rollar: `USER`, `OWNER`, `ADMIN`.

---

### 🔐 Auth — `/api/auth`

| Metod | Yo'l | Auth | Body | Qaytaradi |
|---|---|---|---|---|
| `POST` | `/register` | — | `{ name, phone, password, role? }` (`role` = `USER` yoki `OWNER`, default `USER`) | `{ token, data: User }` |
| `POST` | `/login` | — | `{ phone, password }` | `{ token, data: User }` |
| `GET` | `/me` | ✅ | — | `{ data: User }` |

`User` shape: `{ id, name, phone, role, createdAt, updatedAt }` (parol **hech qachon qaytarilmaydi**).

---

### 🚻 Toilets — `/api/toilets`

| Metod | Yo'l | Auth | Rol | Tavsif |
|---|---|---|---|---|
| `GET` | `/` | — | — | Barcha hojatxonalar. Query: `?status=OPEN`, `?ownerId=5`. |
| `GET` | `/nearby` | — | — | Yaqin atrofdagilar. Pastga qarang. |
| `GET` | `/:id` | — | — | Bitta hojatxona + `owner: {id, name}`. |
| `POST` | `/` | ✅ | `OWNER` | Yangi qo'shish. |
| `PUT` | `/:id` | ✅ | egasi | Yangilash (faqat `ownerId === user.id`). |
| `DELETE` | `/:id` | ✅ | egasi | O'chirish. |

**`GET /nearby` query parametrlari** (eng muhim endpoint):
| Parametr | Tip | Default | Chegara |
|---|---|---|---|
| `lat`, `lng` | `number` | — | **majburiy** |
| `radius` | `number` (km) | `5` | `0.1` – `50` |
| `limit` | `number` | `50` | `1` – `100` |
| `type` | `string` (vergulli) | — | `PUBLIC,PRIVATE,PAID,FREE` |
| `maxPrice` | `number` | — | — |
| `minRating` | `number` | — | `0` – `5` |

Misol: `GET /nearby?lat=41.31&lng=69.27&radius=2&type=FREE,PUBLIC&minRating=4&limit=20`

**Nearby javobi har bir element**: `{ id, name, lat, lng, price, status, type, images: [], avg_rating, distance, owner: {id, name}, createdAt, updatedAt }`.

> ⚠️ `getAllToilets` `owner` qaytarmaydi, faqat `getNearbyToilets` va `getToiletById` qaytaradi. Detail/Map sahifalarida `nearby` yoki `:id` ni ishlating.

**`POST /` body**: `{ name, lat, lng, type, price?, status?, images? }`
- `type`: `PUBLIC` | `PRIVATE` | `PAID` | `FREE` (avtomatik UPPERCASE qilinadi)
- `status`: `OPEN` | `CLOSED` (default `OPEN`)
- `images`: massiv (URL/base64), DB'da JSON string sifatida saqlanadi, javobda massiv qaytadi

---

### ⭐ Reviews — `/api/reviews`

| Metod | Yo'l | Auth | Rol | Tavsif |
|---|---|---|---|---|
| `GET` | `/toilet/:toiletId` | — | — | Hojatxona sharhlari + `user: {id, name}`. |
| `POST` | `/` | ✅ | `USER` | Sharh qoldirish/yangilash (upsert). |
| `DELETE` | `/:id` | ✅ | egasi/`ADMIN` | Sharhni o'chirish. |

**`POST /` body**: `{ toiletId, rating, comment?, quick_feedback? }`
- `rating`: `1` – `5` (majburiy)
- `quick_feedback`: massiv (masalan, `["clean", "friendly"]`), JSON string sifatida saqlanadi
- Bir foydalanuvchi bir hojatxonaga **faqat bitta sharh** qoldira oladi (ikkinchisi avvalgini yangilaydi).

> ℹ️ `Toilet.avg_rating` har `POST` va `DELETE /reviews/:id` dan keyin avtomatik qayta hisoblanadi. Frontend o'zi yangilashi shart emas — toiletni qayta fetch qilish yetarli.

---

### 🛡 Admin — `/api/admin` (faqat `ADMIN`)

| Metod | Yo'l | Tavsif |
|---|---|---|
| `GET` | `/users` | Barcha foydalanuvchilar. |
| `DELETE` | `/users/:id` | Foydalanuvchini o'chirish (cascade — uning hojatxona/sharhlari ham o'chadi, ta'sirlangan toiletlarning `avg_rating`'i qayta hisoblanadi). |
| `GET` | `/stats` | `{ users, toilets, reviews }` sonlari. |

---

### 💬 Realtime — Socket.io

**Ulanish**: `io('http://localhost:5000')`. Token shart emas, lekin **login qilinganidan keyingina ulaning** (foydalanuvchi `id` kerak).

**Eventlar:**

| Event | Yo'nalish | Payload | Ta'sir |
|---|---|---|---|
| `join_personal_room` | client → server | `userId` (Number) | Sizni `user_<id>` xonasiga qo'shadi. |
| `send_message` | client → server | `{ senderId: Number, receiverId: Number, text: String }` | Qabul qiluvchining xonasiga + jo'natuvchiga echo. |
| `receive_message` | server → client | `{ senderId, receiverId, text, sentAt: ISO }` | Yangi xabar keldi. |

> ⚠️ Xabarlar **DB ga yozilmaydi**. Sahifa yangilansa tarix yo'qoladi (kelajakda `Message` modeli rejalashtirilgan).
> ⚠️ `senderId` va `receiverId` **Number** bo'lishi kerak — string yuborsangiz xona topilmaydi va xabar borib tushmaydi.

---

### Frontendchi uchun foydali qoidalar

- **401 ushlash**: `lib/api.js` da har bir `request` ichida `if (response.status === 401) logout()` qo'shilsa, token muddati tugaganda foydalanuvchi avtomatik chiqariladi.
- **Loading holati**: `AuthContext` allaqachon `loading` qaytaradi — sahifalar `useAuth()` orqali oladi.
- **Image upload**: hozir backend rasm yuklashni qo'llab-quvvatlamaydi; frontend ixtiyoriy URL/base64 string'ni `images` massivida yuborishi kerak.
- **Yaqinlik bo'yicha tartiblash**: `nearby` natijalari **distance bo'yicha o'sib boruvchi** tartibda keladi — qo'shimcha sort kerak emas.
- **Avg rating yumaloqlanishi**: backend `toFixed(1)` qiladi — `4.0`, `4.3`, `5.0` ko'rinishida keladi (`4.27` emas).

---

## 🔧 Backend ichki tafsilotlar (chuqur texnik)

API ma'lumotnomasi yuqorida; bu bo'lim **kod ichida nima qilinganini** va **nega** shunday qilinganini hujjatlaydi.

### Loyiha skeleti
- `server.js` — `dotenv` yuklaydi, `http.Server` yaratadi, unga `Socket.io` ni biriktiradi va Express `app` ni mount qiladi (`PORT=5000`).
- `app.js` — faqat o'rama: `cors`, `express.json()`, `/api/health`, 4 ta route guruh va oxirida xato handler. Hech qanday biznes mantiq bu yerda emas.
- `config/prisma.js` — `PrismaClient` singletoni. **Boshqa joydan `new PrismaClient()` qilinmaydi**, aks holda har bir import alohida ulanish ochib yuboradi.

### Ma'lumotlar bazasi (`prisma/schema.prisma`)
3 ta model — **User**, **Toilet**, **Review** (SQLite, `provider = "sqlite"`).

| Model | Diqqat qilish kerak bo'lgan maydonlar |
|---|---|
| `User` | `role` — `String @default("USER")` (enum yo'q, controller `toUpperCase()` qiladi). `phone @unique`. |
| `Toilet` | `images` — JSON-string (DB'da string, javobda massiv). `avg_rating` — **denormalized**, qo'lda yangilanadi. `@@index([lat, lng])` va `@@index([status])`. |
| `Review` | `@@unique([userId, toiletId])` — bir foydalanuvchi bir hojatxonaga **bitta** sharh. `quick_feedback` — JSON-string. |

> ⚠️ Schema `enum UserRole`, `enum ToiletStatus`, `enum ToiletType` deklaratsiya qiladi, lekin SQLite enumlarni qo'llab-quvvatlamaydi — barchasi `String` sifatida saqlanadi. Validatsiya **controllerlarda** (`String(value).toUpperCase()` + `ALLOWED_ROLES`).

### Auth — `bcrypt` emas, `scrypt`
- `utils/password.js` Node-ning native `crypto.scryptSync` dan foydalanadi va parolni `"salt:hash"` formatida saqlaydi.
- `comparePassword` `crypto.timingSafeEqual` ishlatadi — bayt-bayt solishtirish bir xil vaqt sarflaydi, shuning uchun timing-attack orqali parolni topib bo'lmaydi.
- ⚠️ `bcrypt` ga ko'chirish — mavjud foydalanuvchilarning parollarini buzadi, migratsiyasiz qilmang.
- `utils/jwt.js` token ichiga `{ id, phone, role }` ni embed qiladi; `middlewares/authMiddleware.js#authenticateToken` uni `req.user` ga qo'yadi, `authorizeRoles(...)` esa kompozitsion middleware sifatida ishlaydi.

### Nearby qidiruvi — ikki bosqichli filtr
`getNearbyToilets` (`controllers/toiletController.js`) shunday ishlaydi:

1. **SQL bounding-box** (lat/lng deltalari, `[lat, lng]` indeks ishlatiladi):
   - `latDelta = radiusKm / 111`
   - `lngDelta = radiusKm / (111 × cos(lat))`
   - `cosLat > 0.01` tekshiruvi — qutbga yaqin koordinatalarda divide-by-zero himoyasi.
2. **Haversine aniq filtr** (`utils/haversine.js`) — natijada qolgan nomzodlar uchun haqiqiy aylana masofa hisoblanadi, keyin `<= radius` filtrlanadi, `distance` bo'yicha tartiblanadi va `limit` bilan kesiladi.

> Bu pattern "DB tezda kvadrat to'rtburchak ichidagi yozuvlarni topadi → ilova aniq aylanani tekshiradi" — ikkalasi alohida kuchli, birgalikda esa optimizatsiyalangan.

### `avg_rating` — denormalized maydon, 3 joyda qayta hisoblanadi
`utils/ratings.js#recalculateToiletRating(tx, toiletId)` — `prisma.$transaction` ichida chaqiriladigan yagona joy. **`avg_rating` ga to'g'ridan-to'g'ri yozish taqiqlanadi**.

Chaqiriladi:
1. `reviewController.createReview` — `upsert` dan so'ng (transaction ichida).
2. `reviewController.deleteReview` — `delete` dan so'ng (transaction ichida).
3. `adminController.deleteUser` — **muhim pattern**: cascade `User` ni o'chirgunga qadar, ta'sir qilingan `toiletId`-lar `affectedToiletIds` ga snapshot qilinadi. Cascade reviewlarni o'chirgach, har bir saqlangan toilet uchun rating qayta hisoblanadi.

> Bu klassik **"snapshot before cascade"** patterni: agar avval olib qo'ymasangiz, transaction ichida endi mavjud bo'lmagan reviewlardan toiletId'larni topib bo'lmaydi.

### Realtime chat — DB'siz
- Socket.io `server.js` ichida (alohida modul emas).
- `join_personal_room` → har bir foydalanuvchi `user_<id>` xonasiga kiradi.
- `send_message` → qabul qiluvchining xonasiga emit qiladi **VA** yuboruvchiga `socket.emit` orqali echo qaytaradi (frontend lokal append qilmasligi uchun).
- **Persistlik yo'q** — agar foydalanuvchi offlayn bo'lsa, xabar yo'qoladi. `Message` modeli kelajakdagi rejalardan biri.

### Util fayllar — har biri bitta narsa qiladi
| Fayl | Vazifa |
|---|---|
| `utils/jwt.js` | `generateToken(user)` → `{id, phone, role}`. |
| `utils/password.js` | `hashPassword`, `comparePassword` (scrypt + timingSafeEqual). |
| `utils/haversine.js` | `getDistanceInKm(lat1, lng1, lat2, lng2)`. |
| `utils/ratings.js` | `recalculateToiletRating(tx, toiletId)` — `toFixed(1)` bilan yumalata. |
| `utils/serializers.js` | `formatToilet` (images JSON parse), `formatReview` (quick_feedback JSON parse), `sanitizeUser` (parolni qaytarmaydi). |

> Har bir API javobi qaytishidan oldin tegishli serializer orqali o'tkaziladi — frontend hech qachon JSON-string ko'rmaydi.

### Konvensiyalar
- **CommonJS** (`require`) — `package.json` da `"type": "commonjs"`. Frontend ESM, lekin backend qattiq CommonJS.
- **Javob shakli**: hamma controller `{ success, message?, data?, count? }` qaytaradi.
- **Xato boshqaruvi**: hamma controller `try { ... } catch (error) { next(error); }` ko'rinishida yozilgan; `app.js` oxiridagi handler `{ success: false, message }` qaytaradi.

### Backendning oxirgi commitlari
- `78ee933` — nearby filtrlari (`type`, `maxPrice`, `minRating`) va `avg_rating` qayta hisoblash tuzatishlari.
- `a4a3d6c` — `abduvoris` branch ochilishi.
- `f6a99a0` — backend skeletining birinchi versiyasi.

---

## 🚀 Kelajakdagi rejalar (Roadmap)

1.  **Xarita Integratsiyasi (Maps)**: Hojatxonalarni Google Maps yoki Leaflet xaritasida vizual ko'rish.
2.  **To'lov Tizimi**: Pullik hojatxonalar uchun Click/Payme orqali onlayn to'lovni yo'lga qo'yish.
3.  **Filtrlash**: Narxi, reytingi va turi bo'yicha kengaytirilgan qidiruv tizimi.
4.  **Bildirishnomalar (Push Notifications)**: Yangi xabar kelganda foydalanuvchiga bildirishnoma yuborish.
5.  **Ko'p tillilik (i18n)**: Ilovani O'zbek, Rus va Ingliz tillarida ishlatish imkoniyati.
6.  **Mobil Ilova**: React Native yordamida loyihaning mobil versiyasini yaratish.

---

## 🛠 Ishga tushirish ko'rsatmasi

1.  **Backend**: `cd backend && npm run dev`
2.  **Frontend**: `cd frontend && npm run dev`

## 🛠 Muammolarni bartaraf etish (Troubleshooting)

Agar loyihani ishga tushirishda muammolar yuzaga kelsa, quyidagi yechimlarni sinab ko'ring:

### 1. Ma'lumotlar bazasi xatosi (Prisma P6001 / P1001)
- **Muammo**: "The URL must start with prisma://..." yoki baza topilmadi.
- **Yechim**: `backend/.env` faylidagi `DATABASE_URL` yo'li absolyut (to'liq) ekanligini tekshiring. Masalan: `file:C:/Users/admin/Toilet/backend/prisma/dev.db`.
- Keyin backendda `npx prisma generate` buyrug'ini qayta ishga tushiring.

### 2. Frontend stillari yuklanmasa (Tailwind/DaisyUI)
- **Muammo**: UI oddiy HTML ko'rinishida qolib ketsa.
- **Yechim**: `frontend/src/main.jsx` faylida `import 'daisyui/daisyui.css'` borligini tekshiring. Ba'zan brauzer keshini (`Ctrl + F5`) tozalash yordam beradi.

### 3. Port band bo'lsa (EADDRINUSE)
- **Muammo**: 5000 yoki 5173 portlar band.
- **Yechim**: Kompyuterni o'chirib yoqing yoki terminalda `npx kill-port 5000` (agar o'rnatilgan bo'lsa) buyrug'ini ishlating.

### 4. Chat ishlamayotgan bo'lsa
- **Muammo**: Xabarlar bormayapti.
- **Yechim**: Backend ishlayotganiga va brauzer konsolida "Socket connected" xabari borligiga ishonch hosil qiling.

---

Loyiha hozirda to'liq tayyor va ishchi holatda!
