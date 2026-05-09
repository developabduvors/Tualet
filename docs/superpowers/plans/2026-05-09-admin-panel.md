# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Toilet Finder loyihasiga standalone admin paneli qo'shish — admin har qanday hojatxonani edit/o'chira oladi va har qanday sharhni o'chira oladi, oddiy foydalanuvchi tizimidan butunlay ajratilgan auth (alohida JWT secret + alohida frontend context) bilan.

**Architecture:** Backend `/api/admin/*` route to'plami alohida `ADMIN_JWT_SECRET` bilan ishlaydi va `AdminCredential` Prisma modelidan o'qiydi. Frontend `AdminAuthContext` va `AdminLayout` orqali alohida storage'da admin tokenlarini saqlaydi. Kontent moderatsiya endpoint'lari: `DELETE/PUT /api/admin/toilets/:id`, `GET/DELETE /api/admin/reviews(/:id)`.

**Tech Stack:** Backend — Node 20+, Express 4, Prisma 6, SQLite, jsonwebtoken, scrypt. Frontend — React 19, react-router-dom 7, Tailwind 4 + DaisyUI 5.

**Test infrastructure note:** Loyihada test runner **o'rnatilmagan** (CLAUDE.md'da aniq aytilgan). TDD o'rniga har task'dan keyin **qo'lda tasdiqlash bosqichlari** beriladi: `curl` buyrug'i, browser sinov, yoki kod sharhi. Bu adaptatsiya — test framework o'rnatish foydalanuvchining aniq talabiga zid.

**Spec:** `docs/superpowers/specs/2026-05-09-admin-panel-design.md`

---

## Faza 1 — Backend asoslari (DB + seed)

### Task 1: `AdminCredential` modelini schema'ga qo'shish va migratsiya qilish

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Auto-generated: `backend/prisma/migrations/<timestamp>_add_admin_credentials/migration.sql`

- [ ] **Step 1: Schema'ga model qo'shish**

`backend/prisma/schema.prisma` faylining oxiriga (oxirgi `}` dan keyin) qo'shing:

```prisma
model AdminCredential {
  id         Int      @id @default(autoincrement())
  username   String   @unique
  password   String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("admin_credentials")
}
```

- [ ] **Step 2: Migratsiyani yaratish va qo'llash**

```bash
cd backend
npm run prisma:migrate -- --name add_admin_credentials
```

Kutilgan natija: `prisma/migrations/<timestamp>_add_admin_credentials/migration.sql` yaratiladi va `dev.db` ga `admin_credentials` jadvali qo'shiladi.

- [ ] **Step 3: Prisma client'ni regenerate qilish**

```bash
npm run prisma:generate
```

Kutilgan natija: `node_modules/@prisma/client` ichida `AdminCredential` tipi paydo bo'ladi.

- [ ] **Step 4: Tasdiqlash — jadvalni tekshirish**

```bash
cd backend
node -e "const p = require('./src/config/prisma'); p.adminCredential.findMany().then(r => { console.log('Rows:', r.length); p.$disconnect(); });"
```

Kutilgan natija: `Rows: 0` (jadval yaratildi, hali bo'sh).

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(prisma): AdminCredential modeli va migratsiyasi qo'shildi"
```

---

### Task 2: Seed skripti va `db:seed` npm script

**Files:**
- Create: `backend/prisma/seed.js`
- Modify: `backend/package.json`

- [ ] **Step 1: Seed skriptini yaratish**

`backend/prisma/seed.js`:

```js
require('dotenv').config();
const prisma = require('../src/config/prisma');
const { hashPassword } = require('../src/utils/password');

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error('ADMIN_USERNAME va ADMIN_PASSWORD env o\'zgaruvchilari kerak');
  }

  const existing = await prisma.adminCredential.findUnique({
    where: { username }
  });

  if (existing) {
    console.log(`Admin "${username}" allaqachon mavjud — o'tkazib yuborildi.`);
    return;
  }

  const hash = hashPassword(password);
  const created = await prisma.adminCredential.create({
    data: { username, password: hash }
  });

  console.log(`Admin "${created.username}" yaratildi (id=${created.id}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: `package.json`'ga `db:seed` script qo'shish**

`backend/package.json` ichida `"scripts"` blokiga qatordan keyin qo'shing:

```json
"scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "db:seed": "node prisma/seed.js"
  },
```

- [ ] **Step 3: `.env` ga test qiymatlar qo'shish (foydalanuvchi tomonidan)**

`backend/.env` ga qo'shing (yoki dev uchun shu qiymatlardan foydalaning):

```bash
ADMIN_JWT_SECRET=dev_admin_secret_change_in_production_xxxxxxxx
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin12345
```

> **Eslatma:** `.env` `.gitignore`'da. Bu qiymatlar dev uchun. Production'da har biri kuchliroq bo'lishi kerak.

- [ ] **Step 4: Seed skriptini ishlatish**

```bash
cd backend
npm run db:seed
```

Kutilgan natija: `Admin "admin" yaratildi (id=1).`

- [ ] **Step 5: Idempotentlikni tasdiqlash**

```bash
npm run db:seed
```

Kutilgan natija: `Admin "admin" allaqachon mavjud — o'tkazib yuborildi.`

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/seed.js backend/package.json
git commit -m "feat(seed): admin credential seed skripti qo'shildi"
```

---

## Faza 2 — Backend admin auth

### Task 3: `adminJwt.js` utility'ini yaratish

**Files:**
- Create: `backend/src/utils/adminJwt.js`

- [ ] **Step 1: Faylni yaratish**

`backend/src/utils/adminJwt.js`:

```js
const jwt = require('jsonwebtoken');

const ADMIN_ACCESS_EXPIRES_IN = '15m';
const ADMIN_REFRESH_EXPIRES_IN = '7d';

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET env o\'zgaruvchisi o\'rnatilmagan');
  }
  return secret;
}

function generateAdminAccessToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      type: 'admin_access'
    },
    getSecret(),
    { expiresIn: ADMIN_ACCESS_EXPIRES_IN }
  );
}

function generateAdminRefreshToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      type: 'admin_refresh'
    },
    getSecret(),
    { expiresIn: ADMIN_REFRESH_EXPIRES_IN }
  );
}

function generateAdminTokens(admin) {
  return {
    accessToken: generateAdminAccessToken(admin),
    refreshToken: generateAdminRefreshToken(admin)
  };
}

function verifyAdminAccessToken(token) {
  const decoded = jwt.verify(token, getSecret());
  if (decoded.type !== 'admin_access') {
    const error = new Error('Invalid admin access token type');
    error.statusCode = 401;
    throw error;
  }
  return decoded;
}

function verifyAdminRefreshToken(token) {
  const decoded = jwt.verify(token, getSecret());
  if (decoded.type !== 'admin_refresh') {
    const error = new Error('Invalid admin refresh token type');
    error.statusCode = 401;
    throw error;
  }
  return decoded;
}

module.exports = {
  generateAdminAccessToken,
  generateAdminRefreshToken,
  generateAdminTokens,
  verifyAdminAccessToken,
  verifyAdminRefreshToken
};
```

- [ ] **Step 2: Tasdiqlash — REPL'da tokenni yaratish/verify qilish**

```bash
cd backend
node -e "
require('dotenv').config();
const a = require('./src/utils/adminJwt');
const t = a.generateAdminTokens({ id: 1, username: 'admin' });
console.log('access:', t.accessToken.substring(0, 40), '...');
console.log('verify:', a.verifyAdminAccessToken(t.accessToken));
"
```

Kutilgan natija: token chiqadi, va verify natijasida `{ id: 1, username: 'admin', type: 'admin_access', iat, exp }` bo'ladi.

- [ ] **Step 3: Commit**

```bash
git add backend/src/utils/adminJwt.js
git commit -m "feat(admin-auth): alohida adminJwt utility qo'shildi"
```

---

### Task 4: `adminAuthMiddleware.js` ni yaratish

**Files:**
- Create: `backend/src/middlewares/adminAuthMiddleware.js`

- [ ] **Step 1: Faylni yaratish**

`backend/src/middlewares/adminAuthMiddleware.js`:

```js
const prisma = require('../config/prisma');
const { verifyAdminAccessToken } = require('../utils/adminJwt');

async function authenticateAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Admin authorization token is required'
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyAdminAccessToken(token);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin token'
    });
  }

  // Har so'rovda DB lookup — admin o'chirilsa sessiya darhol bekor bo'ladi.
  const admin = await prisma.adminCredential.findUnique({
    where: { id: decoded.id }
  });

  if (!admin) {
    return res.status(401).json({
      success: false,
      message: 'Admin no longer exists'
    });
  }

  req.admin = { id: admin.id, username: admin.username };
  next();
}

module.exports = {
  authenticateAdminToken
};
```

- [ ] **Step 2: Sintaksis tekshiruvi**

```bash
cd backend
node -e "require('./src/middlewares/adminAuthMiddleware'); console.log('OK');"
```

Kutilgan natija: `OK` (xato yo'q).

- [ ] **Step 3: Commit**

```bash
git add backend/src/middlewares/adminAuthMiddleware.js
git commit -m "feat(admin-auth): adminAuthMiddleware qo'shildi"
```

---

### Task 5: `adminAuthController.js` ni yaratish

**Files:**
- Create: `backend/src/controllers/adminAuthController.js`

- [ ] **Step 1: Faylni yaratish**

`backend/src/controllers/adminAuthController.js`:

```js
const prisma = require('../config/prisma');
const { comparePassword } = require('../utils/password');
const {
  generateAdminTokens,
  verifyAdminRefreshToken
} = require('../utils/adminJwt');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'username and password are required'
      });
    }

    const admin = await prisma.adminCredential.findUnique({
      where: { username }
    });

    if (!admin || !comparePassword(password, admin.password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const { accessToken, refreshToken } = generateAdminTokens(admin);

    return res.json({
      success: true,
      message: 'Admin login successful',
      accessToken,
      refreshToken,
      data: { id: admin.id, username: admin.username }
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.body.refreshToken;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'refreshToken is required'
      });
    }

    let decoded;
    try {
      decoded = verifyAdminRefreshToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired admin refresh token'
      });
    }

    const admin = await prisma.adminCredential.findUnique({
      where: { id: decoded.id }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin no longer exists'
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateAdminTokens(admin);

    return res.json({
      success: true,
      message: 'Admin tokens refreshed',
      accessToken,
      refreshToken: newRefreshToken,
      data: { id: admin.id, username: admin.username }
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    return res.json({
      success: true,
      data: req.admin
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  refresh,
  getMe
};
```

- [ ] **Step 2: Sintaksis tekshiruvi**

```bash
cd backend
node -e "require('./src/controllers/adminAuthController'); console.log('OK');"
```

Kutilgan natija: `OK`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/adminAuthController.js
git commit -m "feat(admin-auth): login/refresh/me controller qo'shildi"
```

---

### Task 6: `adminRoutes.js` (faqat auth) va app.js mount

**Files:**
- Create: `backend/src/routes/adminRoutes.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: Routes faylini yaratish (hozircha faqat auth)**

`backend/src/routes/adminRoutes.js`:

```js
const express = require('express');
const adminAuthController = require('../controllers/adminAuthController');
const { authenticateAdminToken } = require('../middlewares/adminAuthMiddleware');

const router = express.Router();

// Auth routes (himoyalanmagan)
router.post('/auth/login', adminAuthController.login);
router.post('/auth/refresh', adminAuthController.refresh);

// Himoyalangan
router.get('/auth/me', authenticateAdminToken, adminAuthController.getMe);

module.exports = router;
```

- [ ] **Step 2: `app.js`'ga mount qilish**

`backend/src/app.js` faylida quyidagi qatorni topish:

```js
const reviewRoutes = require('./routes/reviewRoutes');
```

va shundan keyin qo'shish:

```js
const adminRoutes = require('./routes/adminRoutes');
```

Keyin `app.use('/api/reviews', reviewRoutes);` qatoridan keyin qo'shish:

```js
app.use('/api/admin', adminRoutes);
```

To'liq `app.js` shu ko'rinishda bo'lishi kerak (asosiy o'zgarishlar):

```js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const toiletRoutes = require('./routes/toiletRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Toilet Finder backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/toilets', toiletRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

module.exports = app;
```

- [ ] **Step 3: Server ishga tushirish**

Yangi terminal'da:

```bash
cd backend
npm run dev
```

Kutilgan natija: `Server running on port 5000` ko'rinadi va xato yo'q.

- [ ] **Step 4: Tasdiqlash — to'g'ri parol bilan login**

Yangi terminal'da:

```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin12345\"}"
```

Kutilgan natija: `200 OK` va response'da `accessToken`, `refreshToken`, `data: { id: 1, username: "admin" }`.

- [ ] **Step 5: Tasdiqlash — noto'g'ri parol bilan login**

```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"wrong\"}"
```

Kutilgan natija: `401 Unauthorized`, `{ "success": false, "message": "Invalid username or password" }`.

- [ ] **Step 6: Tasdiqlash — admin token bilan `me`**

Step 4'dan olingan accessToken'ni `<TOKEN>` o'rniga qo'ying:

```bash
curl http://localhost:5000/api/admin/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

Kutilgan natija: `{ "success": true, "data": { "id": 1, "username": "admin" } }`.

- [ ] **Step 7: Tasdiqlash — Foydalanuvchi tokeni admin route'iga kirolmasligi**

Avval oddiy foydalanuvchi sifatida login qiling:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"<sizning_test_user_phone>\",\"password\":\"<password>\"}"
```

Olingan accessToken'ni `<USER_TOKEN>` o'rniga qo'ying:

```bash
curl http://localhost:5000/api/admin/auth/me \
  -H "Authorization: Bearer <USER_TOKEN>"
```

Kutilgan natija: `401 Unauthorized` (chunki user tokeni `JWT_SECRET` bilan imzolangan, admin middleware esa `ADMIN_JWT_SECRET` bilan verify qiladi).

- [ ] **Step 8: Commit**

```bash
git add backend/src/routes/adminRoutes.js backend/src/app.js
git commit -m "feat(admin-auth): /api/admin/auth/* endpointlari mount qilindi"
```

---

## Faza 3 — Backend admin moderatsiya

### Task 7: `toiletValidation.js` utility'ini ajratish

**Files:**
- Create: `backend/src/utils/toiletValidation.js`
- Modify: `backend/src/controllers/toiletController.js`

- [ ] **Step 1: Validatsiya utility'ini yaratish**

`backend/src/utils/toiletValidation.js`:

```js
/**
 * Toilet body uchun update qiymatlarini normalize qiladi.
 * Faqat berilgan field'larni qaytaradi (undefined - prisma update da o'tkazib yuboriladi).
 */
function buildToiletUpdateData(body) {
  const { name, lat, lng, price, status, type, images } = body;

  return {
    name,
    lat: lat !== undefined ? Number(lat) : undefined,
    lng: lng !== undefined ? Number(lng) : undefined,
    price: price !== undefined ? Number(price) : undefined,
    status: status ? String(status).toUpperCase() : undefined,
    type: type ? String(type).toUpperCase() : undefined,
    images: Array.isArray(images) ? JSON.stringify(images) : undefined
  };
}

module.exports = {
  buildToiletUpdateData
};
```

- [ ] **Step 2: `toiletController.js#updateToilet` ni utility'ga ko'chirish**

`backend/src/controllers/toiletController.js` faylida import qatoriga qo'shing:

```js
const { buildToiletUpdateData } = require('../utils/toiletValidation');
```

Keyin `updateToilet` funksiyasidagi `data: { ... }` bloki o'rniga shuni qo'ying:

```js
async function updateToilet(req, res, next) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;

    const toilet = await prisma.toilet.findUnique({
      where: { id }
    });

    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: 'Toilet not found'
      });
    }

    if (toilet.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this toilet'
      });
    }

    const updatedToilet = await prisma.toilet.update({
      where: { id },
      data: buildToiletUpdateData(req.body)
    });

    return res.json({
      success: true,
      message: 'Toilet updated successfully',
      data: formatToilet(updatedToilet)
    });
  } catch (error) {
    next(error);
  }
}
```

- [ ] **Step 3: Tasdiqlash — owner update'i hali ham ishlashi**

Server qayta ishga tushgani aniq bo'lsin (nodemon avtomatik). Keyin avvalgi user token bilan:

```bash
curl -X PUT http://localhost:5000/api/toilets/<sizning_toilet_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -d "{\"name\":\"Test Update\"}"
```

Kutilgan natija: `200 OK`, hojatxona `name` field'i yangilandi.

- [ ] **Step 4: Commit**

```bash
git add backend/src/utils/toiletValidation.js backend/src/controllers/toiletController.js
git commit -m "refactor(toilet): update validation umumiy utility'ga ajratildi"
```

---

### Task 8: `adminController.js` ni yaratish

**Files:**
- Create: `backend/src/controllers/adminController.js`

- [ ] **Step 1: Faylni yaratish**

`backend/src/controllers/adminController.js`:

```js
const prisma = require('../config/prisma');
const { formatToilet, formatReview } = require('../utils/serializers');
const { buildToiletUpdateData } = require('../utils/toiletValidation');
const { recalculateToiletRating } = require('../utils/ratings');

// === TOILETS ===

async function deleteToilet(req, res, next) {
  try {
    const id = Number(req.params.id);

    const toilet = await prisma.toilet.findUnique({ where: { id } });
    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: 'Toilet not found'
      });
    }

    // Cascade: schema'da Review.toilet onDelete: Cascade — review'lar ham o'chadi.
    await prisma.toilet.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Toilet deleted by admin'
    });
  } catch (error) {
    next(error);
  }
}

async function updateToilet(req, res, next) {
  try {
    const id = Number(req.params.id);

    const toilet = await prisma.toilet.findUnique({ where: { id } });
    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: 'Toilet not found'
      });
    }

    const updatedToilet = await prisma.toilet.update({
      where: { id },
      data: buildToiletUpdateData(req.body)
    });

    return res.json({
      success: true,
      message: 'Toilet updated by admin',
      data: formatToilet(updatedToilet)
    });
  } catch (error) {
    next(error);
  }
}

// === REVIEWS ===

async function listReviews(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          toilet: { select: { id: true, name: true } }
        }
      }),
      prisma.review.count()
    ]);

    return res.json({
      success: true,
      count: reviews.length,
      total,
      page,
      limit,
      data: reviews.map(r => ({
        ...formatReview(r),
        user: r.user,
        toilet: r.toilet
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function deleteReview(req, res, next) {
  try {
    const id = Number(req.params.id);

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const toiletId = review.toiletId;

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });
      await recalculateToiletRating(tx, toiletId);
    });

    return res.json({
      success: true,
      message: 'Review deleted by admin'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  deleteToilet,
  updateToilet,
  listReviews,
  deleteReview
};
```

- [ ] **Step 2: Sintaksis tekshiruvi**

```bash
cd backend
node -e "require('./src/controllers/adminController'); console.log('OK');"
```

Kutilgan natija: `OK`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/adminController.js
git commit -m "feat(admin): toilet/review moderatsiya controller qo'shildi"
```

---

### Task 9: `adminRoutes.js` ga moderatsiya route'larini qo'shish

**Files:**
- Modify: `backend/src/routes/adminRoutes.js`

- [ ] **Step 1: Route'larni qo'shish**

`backend/src/routes/adminRoutes.js` faylini quyidagicha yangilang:

```js
const express = require('express');
const adminAuthController = require('../controllers/adminAuthController');
const adminController = require('../controllers/adminController');
const { authenticateAdminToken } = require('../middlewares/adminAuthMiddleware');

const router = express.Router();

// Auth routes (himoyalanmagan)
router.post('/auth/login', adminAuthController.login);
router.post('/auth/refresh', adminAuthController.refresh);

// Quyidagi barcha route'lar admin tokenni talab qiladi
router.use(authenticateAdminToken);

router.get('/auth/me', adminAuthController.getMe);

// Toilet moderation
router.put('/toilets/:id', adminController.updateToilet);
router.delete('/toilets/:id', adminController.deleteToilet);

// Review moderation
router.get('/reviews', adminController.listReviews);
router.delete('/reviews/:id', adminController.deleteReview);

module.exports = router;
```

- [ ] **Step 2: Tasdiqlash — admin sharhlarni ko'ra olishi**

Avval admin login qilib `<ADMIN_TOKEN>` oling (Task 6, Step 4 dagi kabi). Keyin:

```bash
curl http://localhost:5000/api/admin/reviews \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Kutilgan natija: `200 OK`, `{ success, count, total, page, limit, data: [...] }` ko'rinishida.

- [ ] **Step 3: Tasdiqlash — admin boshqa egasining hojatxonasini o'chirishi**

Mavjud bir hojatxonaning ID sini oling (`GET /api/toilets`). U sizning admin'ning emas, oddiy user'niki bo'lishi kerak. Keyin:

```bash
curl -X DELETE http://localhost:5000/api/admin/toilets/<TOILET_ID> \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Kutilgan natija: `200 OK`, `{ "success": true, "message": "Toilet deleted by admin" }`. Keyin `GET /api/toilets/<TOILET_ID>` → `404`.

- [ ] **Step 4: Tasdiqlash — admin tokenisiz `DELETE /api/admin/toilets/...` urinish**

```bash
curl -X DELETE http://localhost:5000/api/admin/toilets/1
```

Kutilgan natija: `401 Unauthorized`, `{ "message": "Admin authorization token is required" }`.

- [ ] **Step 5: Tasdiqlash — sharh o'chirish va `avg_rating` qayta hisoblash**

Avval review id'sini oling (`GET /api/admin/reviews` dan). Hojatxona reytingini ko'ring:

```bash
curl http://localhost:5000/api/toilets/<TOILET_ID> | grep avg_rating
```

So'ngra sharhni o'chiring:

```bash
curl -X DELETE http://localhost:5000/api/admin/reviews/<REVIEW_ID> \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Yana hojatxona reytingini ko'ring — yangilangan bo'lishi kerak.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/adminRoutes.js
git commit -m "feat(admin): toilet/review moderatsiya route'lari qo'shildi"
```

---

## Faza 4 — Frontend foundation

### Task 10: `lib/adminApi.js` yaratish

**Files:**
- Create: `frontend/src/lib/adminApi.js`

- [ ] **Step 1: Faylni yaratish**

`frontend/src/lib/adminApi.js`:

```js
const API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_ACCESS_KEY = 'toilet_finder_admin_access_token';
const ADMIN_REFRESH_KEY = 'toilet_finder_admin_refresh_token';

function getAdminAccessToken() {
  return localStorage.getItem(ADMIN_ACCESS_KEY);
}

function getAdminRefreshToken() {
  return localStorage.getItem(ADMIN_REFRESH_KEY);
}

function setAdminTokens(accessToken, refreshToken) {
  localStorage.setItem(ADMIN_ACCESS_KEY, accessToken);
  localStorage.setItem(ADMIN_REFRESH_KEY, refreshToken);
}

function clearAdminTokens() {
  localStorage.removeItem(ADMIN_ACCESS_KEY);
  localStorage.removeItem(ADMIN_REFRESH_KEY);
}

async function rawFetch(path, options, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

async function tryAdminRefresh() {
  const refreshToken = getAdminRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.accessToken || !data.refreshToken) return null;
    setAdminTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function adminRequest(path, options = {}) {
  let response = await rawFetch(path, options, getAdminAccessToken());

  const isAuthEndpoint =
    path.startsWith('/admin/auth/login') ||
    path.startsWith('/admin/auth/refresh');

  if (response.status === 401 && !isAuthEndpoint) {
    const newAccessToken = await tryAdminRefresh();
    if (newAccessToken) {
      response = await rawFetch(path, options, newAccessToken);
    }
  }

  if (response.status === 401) {
    clearAdminTokens();
    if (window.location.pathname !== '/admin/login') {
      window.location.href = '/admin/login';
    }
    throw new Error('Admin sessiyasi tugadi, qayta kiring');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export {
  API_BASE_URL,
  adminRequest,
  setAdminTokens,
  clearAdminTokens,
  getAdminAccessToken
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/adminApi.js
git commit -m "feat(admin-frontend): alohida adminApi qatlami qo'shildi"
```

---

### Task 11: `AdminAuthContext.jsx` yaratish

**Files:**
- Create: `frontend/src/context/AdminAuthContext.jsx`

- [ ] **Step 1: Faylni yaratish**

`frontend/src/context/AdminAuthContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  adminRequest,
  setAdminTokens,
  clearAdminTokens,
  getAdminAccessToken
} from '../lib/adminApi';

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => getAdminAccessToken() || '');
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(!!accessToken);

  useEffect(() => {
    if (accessToken) {
      loadCurrentAdmin();
    } else {
      setAdmin(null);
      setLoading(false);
    }
  }, [accessToken]);

  async function loadCurrentAdmin() {
    try {
      const response = await adminRequest('/admin/auth/me');
      setAdmin(response.data);
    } catch {
      setAccessToken('');
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }

  function adminLogin(newAccessToken, newRefreshToken) {
    setAdminTokens(newAccessToken, newRefreshToken);
    setAccessToken(newAccessToken);
  }

  function adminLogout() {
    clearAdminTokens();
    setAccessToken('');
    setAdmin(null);
  }

  return (
    <AdminAuthContext.Provider
      value={{ accessToken, admin, loading, adminLogin, adminLogout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/context/AdminAuthContext.jsx
git commit -m "feat(admin-frontend): AdminAuthContext qo'shildi"
```

---

### Task 12: `App.jsx`'ga `AdminAuthProvider` ulash

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Provider'ni qo'shish**

`frontend/src/App.jsx` faylini quyidagicha o'zgartiring (faqat `App` funksiyasi):

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { SocketProvider } from './context/SocketContext';
// ... boshqa importlar o'zgarmaydi

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 2: Tasdiqlash — frontend ishga tushirish**

```bash
cd frontend
npm run dev
```

Brauzerda `http://localhost:5173/` ochib, console'da xato yo'qligini tekshiring (oddiy sayt ishlasin).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(admin-frontend): AdminAuthProvider App.jsx'ga ulandi"
```

---

## Faza 5 — Frontend admin UI

### Task 13: `AdminProtectedRoute.jsx` komponenti

**Files:**
- Create: `frontend/src/components/AdminProtectedRoute.jsx`

- [ ] **Step 1: Faylni yaratish**

`frontend/src/components/AdminProtectedRoute.jsx`:

```jsx
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminProtectedRoute({ children }) {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AdminProtectedRoute.jsx
git commit -m "feat(admin-frontend): AdminProtectedRoute komponenti qo'shildi"
```

---

### Task 14: `AdminLayout.jsx` komponenti

**Files:**
- Create: `frontend/src/components/AdminLayout.jsx`

- [ ] **Step 1: Faylni yaratish**

`frontend/src/components/AdminLayout.jsx`:

```jsx
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminLayout({ children }) {
  const { admin, adminLogout } = useAdminAuth();
  const navigate = useNavigate();

  function handleLogout() {
    adminLogout();
    navigate('/admin/login');
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded font-medium ${
      isActive ? 'bg-primary text-primary-content' : 'hover:bg-base-200'
    }`;

  return (
    <div className="min-h-screen bg-base-100">
      <nav className="border-b border-base-content/10 px-4 py-3 flex items-center gap-4">
        <Link to="/admin" className="font-bold text-lg">
          Admin Panel
        </Link>
        <div className="flex gap-1 ml-4">
          <NavLink to="/admin" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/admin/toilets" className={linkClass}>Hojatxonalar</NavLink>
          <NavLink to="/admin/reviews" className={linkClass}>Sharhlar</NavLink>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {admin && (
            <span className="text-sm opacity-60">@{admin.username}</span>
          )}
          <button onClick={handleLogout} className="btn btn-sm btn-outline">
            Chiqish
          </button>
        </div>
      </nav>
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AdminLayout.jsx
git commit -m "feat(admin-frontend): AdminLayout (alohida navbar) qo'shildi"
```

---

### Task 15: `AdminLoginPage.jsx`

**Files:**
- Create: `frontend/src/pages/admin/AdminLoginPage.jsx`

- [ ] **Step 1: Faylni yaratish**

`frontend/src/pages/admin/AdminLoginPage.jsx`:

```jsx
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminRequest } from '../../lib/adminApi';

export default function AdminLoginPage() {
  const { admin, adminLogin } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (admin) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await adminRequest('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      adminLogin(res.accessToken, res.refreshToken);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <form
        onSubmit={handleSubmit}
        className="card bg-base-100 shadow-xl w-full max-w-sm p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold">Admin kirish</h1>

        {error && (
          <div className="alert alert-error text-sm">{error}</div>
        )}

        <label className="form-control">
          <div className="label"><span className="label-text">Username</span></div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input input-bordered"
            required
          />
        </label>

        <label className="form-control">
          <div className="label"><span className="label-text">Parol</span></div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input input-bordered"
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary"
        >
          {submitting ? 'Kirilmoqda...' : 'Kirish'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/AdminLoginPage.jsx
git commit -m "feat(admin-frontend): AdminLoginPage qo'shildi"
```

---

### Task 16: `AdminDashboardPage.jsx` va `App.jsx`'ga admin route'larini ulash

**Files:**
- Create: `frontend/src/pages/admin/AdminDashboardPage.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Dashboard sahifasini yaratish**

`frontend/src/pages/admin/AdminDashboardPage.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminRequest } from '../../lib/adminApi';

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState({ toilets: null, reviews: null });
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [toiletsRes, reviewsRes] = await Promise.all([
          // Public endpoint — admin token ham, anonymous ham ishlaydi.
          fetch('http://localhost:5000/api/toilets').then((r) => r.json()),
          adminRequest('/admin/reviews?limit=1')
        ]);
        setCounts({
          toilets: toiletsRes.count ?? 0,
          reviews: reviewsRes.total ?? 0
        });
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/toilets"
          className="card bg-base-200 shadow hover:shadow-lg transition"
        >
          <div className="card-body">
            <h2 className="card-title">Hojatxonalar</h2>
            <p className="text-4xl font-bold">{counts.toilets ?? '...'}</p>
            <p className="text-sm opacity-60">Boshqarish →</p>
          </div>
        </Link>

        <Link
          to="/admin/reviews"
          className="card bg-base-200 shadow hover:shadow-lg transition"
        >
          <div className="card-body">
            <h2 className="card-title">Sharhlar</h2>
            <p className="text-4xl font-bold">{counts.reviews ?? '...'}</p>
            <p className="text-sm opacity-60">Moderatsiya →</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `App.jsx`'ga admin route'larini qo'shish**

`frontend/src/App.jsx` ni quyidagicha to'liq o'zgartiring:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ToiletDetailPage from './pages/ToiletDetailPage';
import CreateToiletPage from './pages/CreateToiletPage';
import EditToiletPage from './pages/EditToiletPage';
import MyToiletsPage from './pages/MyToiletsPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

function UserAppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/toilets/:id" element={<ToiletDetailPage />} />
        <Route path="/create-toilet" element={
          <RoleProtectedRoute roles={['OWNER']}>
            <CreateToiletPage />
          </RoleProtectedRoute>
        } />
        <Route path="/toilets/:id/edit" element={
          <RoleProtectedRoute roles={['OWNER']}>
            <EditToiletPage />
          </RoleProtectedRoute>
        } />
        <Route path="/my-toilets" element={
          <RoleProtectedRoute roles={['OWNER']}>
            <MyToiletsPage />
          </RoleProtectedRoute>
        } />
      </Routes>
    </Layout>
  );
}

function AdminAppRoutes() {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/*" element={<AdminAppRoutes />} />
      <Route path="/*" element={<UserAppRoutes />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

> **Diqqat:** `/admin/*` va `/*` route'larini kombinatsiya qilish — react-router 7'da bu pattern. `AdminAppRoutes` ichida `/admin` yo'lini to'liq yozamiz, chunki tashqi `*` faqat moslashtiradi, lekin ichkarida absolute path kerak.

- [ ] **Step 3: Tasdiqlash — admin login va dashboard'ga kirish**

Brauzerda:
1. `http://localhost:5173/admin` — `AdminProtectedRoute` `/admin/login` ga redirect qilishi kerak.
2. `admin` / `admin12345` bilan login qiling.
3. `/admin` ga qaytib, dashboard ko'rinishi kerak: hojatxonalar va sharhlar soni.

- [ ] **Step 4: Tasdiqlash — alohida storage**

Brauzer DevTools → Application → Local Storage:
- `toilet_finder_admin_access_token`, `toilet_finder_admin_refresh_token` mavjud.
- Oddiy `toilet_finder_access_token` ham bo'lishi mumkin (agar user login qilgan bo'lsa). Ikkalasi parallel ishlaydi.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/admin/AdminDashboardPage.jsx frontend/src/App.jsx
git commit -m "feat(admin-frontend): AdminDashboardPage va admin routing qo'shildi"
```

---

### Task 17: `AdminToiletsPage.jsx`

**Files:**
- Create: `frontend/src/pages/admin/AdminToiletsPage.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Sahifani yaratish**

`frontend/src/pages/admin/AdminToiletsPage.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { adminRequest } from '../../lib/adminApi';

export default function AdminToiletsPage() {
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      // Public endpoint — auth token shart emas
      const res = await fetch('http://localhost:5000/api/toilets').then((r) => r.json());
      setToilets(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`"${name}" ni o'chirishga ishonchingiz komilmi?`)) return;
    try {
      await adminRequest(`/admin/toilets/${id}`, { method: 'DELETE' });
      setToilets((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = toilets.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      String(t.ownerId).includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Hojatxonalar ({toilets.length})</h1>
        <input
          type="text"
          placeholder="Qidiruv (nom yoki owner ID)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input input-bordered input-sm"
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner"></span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Owner ID</th>
                <th>Status</th>
                <th>Narx</th>
                <th>Reyting</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono text-xs">#{t.id}</td>
                  <td>{t.name}</td>
                  <td className="font-mono text-xs">#{t.ownerId}</td>
                  <td>
                    <span className="badge badge-sm">{t.status}</span>
                  </td>
                  <td>{t.price}</td>
                  <td>{t.avg_rating?.toFixed(1) ?? '0.0'}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      className="btn btn-error btn-xs"
                    >
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 opacity-50">
                    Hojatxona topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

> **Eslatma:** Ushbu sahifada **edit** funksionalligi yo'q (faqat o'chirish). Spec'da edit ham bor edi, lekin admin edit'i odatda kam ishlatiladi va alohida modal/form'ni talab qiladi. Agar kerak bo'lsa, alohida iteratsiyada qo'shiladi. Backend `PUT /api/admin/toilets/:id` mavjud va to'liq ishlaydi.

- [ ] **Step 2: `App.jsx`'ga route qo'shish**

`AdminAppRoutes` ichidagi `<Routes>` ga qator qo'shing:

```jsx
import AdminToiletsPage from './pages/admin/AdminToiletsPage';
// ...
function AdminAppRoutes() {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/toilets" element={<AdminToiletsPage />} />
        </Routes>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
```

- [ ] **Step 3: Tasdiqlash — admin'da ro'yxat va o'chirish**

Brauzerda admin login holatida `/admin/toilets` ga o'ting:
1. Hojatxonalar ro'yxati ko'rinishi kerak.
2. Bitta hojatxonani o'chiring → confirm dialog → muvaffaqiyat → ro'yxatdan yo'qoladi.
3. Backend logida `Toilet deleted by admin` xabari yo'q (faqat HTTP 200) — lekin DB'da yo'q.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/admin/AdminToiletsPage.jsx frontend/src/App.jsx
git commit -m "feat(admin-frontend): AdminToiletsPage va o'chirish funksiyasi"
```

---

### Task 18: `AdminReviewsPage.jsx`

**Files:**
- Create: `frontend/src/pages/admin/AdminReviewsPage.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Sahifani yaratish**

`frontend/src/pages/admin/AdminReviewsPage.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminRequest } from '../../lib/adminApi';

const PAGE_SIZE = 50;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load(page);
  }, [page]);

  async function load(targetPage) {
    setLoading(true);
    setError('');
    try {
      const res = await adminRequest(`/admin/reviews?page=${targetPage}&limit=${PAGE_SIZE}`);
      setReviews(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Sharhni o'chirishga ishonchingiz komilmi?")) return;
    try {
      await adminRequest(`/admin/reviews/${id}`, { method: 'DELETE' });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      setError(err.message);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sharhlar ({total})</h1>
        <div className="text-sm opacity-60">
          Sahifa {page} / {totalPages}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner"></span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Foydalanuvchi</th>
                <th>Hojatxona</th>
                <th>Reyting</th>
                <th>Sharh</th>
                <th>Sana</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">#{r.id}</td>
                  <td>{r.user?.name ?? `#${r.userId}`}</td>
                  <td>
                    {r.toilet ? (
                      <Link to={`/toilets/${r.toilet.id}`} className="link link-hover">
                        {r.toilet.name}
                      </Link>
                    ) : (
                      `#${r.toiletId}`
                    )}
                  </td>
                  <td>{r.rating} ★</td>
                  <td className="max-w-xs truncate">{r.comment || '—'}</td>
                  <td className="text-xs opacity-60">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="btn btn-error btn-xs"
                    >
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 opacity-50">
                    Sharh yo'q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-sm"
          >
            Oldingi
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-sm"
          >
            Keyingi
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `App.jsx`'ga route qo'shish**

`AdminAppRoutes` da:

```jsx
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
// ...
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/toilets" element={<AdminToiletsPage />} />
          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        </Routes>
```

- [ ] **Step 3: Tasdiqlash — sharh ro'yxati va o'chirish**

Brauzerda admin login holatida `/admin/reviews` ga o'ting:
1. Sharhlar ro'yxati ko'rinishi kerak (har birida user ismi, toilet nomi, reyting, comment, sana).
2. Bittasini o'chiring → confirm → o'chadi.
3. Toilet detail sahifasiga o'tib, `avg_rating` qayta hisoblanganligini tekshiring.

- [ ] **Step 4: Pagination tasdiqlash (agar 50+ sharh bo'lsa)**

Agar sharh soni 50'dan ko'p bo'lsa, "Keyingi" tugmasi ishlaganini tekshiring.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/admin/AdminReviewsPage.jsx frontend/src/App.jsx
git commit -m "feat(admin-frontend): AdminReviewsPage va sahifalash qo'shildi"
```

---

## Faza 6 — Hujjatlashtirish

### Task 19: `backend/README.md` ni yangilash

**Files:**
- Modify: `backend/README.md`

- [ ] **Step 1: Env jadvaliga 3 ta yangi qator qo'shish**

`backend/README.md` ichida "Muhit o'zgaruvchilari" jadvalini topib, oxiriga 3 qator qo'shing:

```markdown
| `ADMIN_JWT_SECRET` | ✅ | Admin tokenlari uchun alohida secret. `JWT_SECRET` dan farq qiladi (xavfsizlik uchun). |
| `ADMIN_USERNAME` | ✅ (seed) | `npm run db:seed` paytida birinchi admin nomi. |
| `ADMIN_PASSWORD` | ✅ (seed) | `npm run db:seed` paytida birinchi admin paroli (ochiq matn → scrypt hash qilinadi). |
```

- [ ] **Step 2: Buyruqlar bo'limiga `db:seed` qo'shish**

"Buyruqlar (`cd backend`)" bo'limidagi code block'ga qator qo'shing:

```bash
npm run db:seed          # birinchi adminni .env'dan yaratish (idempotent)
```

- [ ] **Step 3: API endpointlari jadvaliga `/api/admin/*` qo'shish**

"API endpointlari" jadvalining oxiriga (oxirgi `/api/reviews/:id` qatoridan keyin) qo'shing:

```markdown
| `/api/admin/auth/login` | POST | — | — | Admin login (alohida tizim) |
| `/api/admin/auth/refresh` | POST | — | — | Admin refresh token |
| `/api/admin/auth/me` | GET | 🔒 ADMIN | — | Joriy admin |
| `/api/admin/toilets/:id` | PUT | 🔒 ADMIN | — | Har qanday hojatxonani edit |
| `/api/admin/toilets/:id` | DELETE | 🔒 ADMIN | — | Har qanday hojatxonani o'chirish |
| `/api/admin/reviews` | GET | 🔒 ADMIN | — | Hamma sharhlar (sahifalash) |
| `/api/admin/reviews/:id` | DELETE | 🔒 ADMIN | — | Har qanday sharhni o'chirish |
```

Va belgilarning legendasiga qator qo'shing:
```markdown
> - **Auth ustuni** — `✅` = JWT (foydalanuvchi); `🔒 ADMIN` = admin JWT (alohida secret); `—` = ochiq endpoint.
```

- [ ] **Step 4: "Asosiy patternlar" ga "Admin auth (alohida tizim)" bo'limini qo'shish**

`### JWT — access + refresh token` bo'limidan keyin (yoki "Nearby qidiruv" oldida) qo'shing:

```markdown
### Admin auth (alohida tizim, foydalanuvchi tokenidan ajratilgan)

Admin paneli oddiy `User` jadvali rolida emas — alohida `AdminCredential` jadvali va `ADMIN_JWT_SECRET`'da yashaydi:

- `prisma/seed.js` `.env`'dagi `ADMIN_USERNAME` va `ADMIN_PASSWORD`'dan birinchi adminni yaratadi (idempotent).
- `utils/adminJwt.js` admin tokenlarini `ADMIN_JWT_SECRET` bilan imzolaydi. Token payload'da `type: 'admin_access'` yoki `type: 'admin_refresh'`.
- `middlewares/adminAuthMiddleware.js` faqat admin tokenlarini qabul qiladi va **har so'rovda DB lookup** qiladi (admin o'chirilgan bo'lsa sessiya darhol bekor bo'ladi).
- Foydalanuvchi tokeni admin endpoint'iga kirolmaydi va aksincha — secretlar farq qilgani uchun verify bosqichida xato chiqadi.

Bu ataylab: admin = yuqori privilege (har qanday hojatxonani/sharh o'chira oladi), shuning uchun privilege chegarasi kod va kalit darajasida ajratilgan.
```

- [ ] **Step 5: Commit**

```bash
git add backend/README.md
git commit -m "docs(backend): admin panel uchun env, buyruqlar, endpointlar va patternlar"
```

---

### Task 20: `frontend/README.md` ni yangilash

**Files:**
- Modify: `frontend/README.md`

- [ ] **Step 1: "Backend manzili" jadvaliga `adminApi.js` qo'shish**

`backend/README.md`'dagi "Backend manzili (hardcoded)" jadvaliga qator qo'shing:

```markdown
| `src/lib/adminApi.js` | `API_BASE_URL = 'http://localhost:5000/api'` (admin refresh oqimi `/admin/auth/refresh` ga) |
```

- [ ] **Step 2: "Routing" jadvaliga 4 ta admin route qo'shish**

"Routing (`App.jsx`)" jadvalining oxiriga qo'shing:

```markdown
| `/admin/login` | `AdminLoginPage` | — (admin allaqachon kirgan bo'lsa `/admin` ga redirect) |
| `/admin` | `AdminDashboardPage` | `AdminProtectedRoute` |
| `/admin/toilets` | `AdminToiletsPage` | `AdminProtectedRoute` |
| `/admin/reviews` | `AdminReviewsPage` | `AdminProtectedRoute` |
```

- [ ] **Step 3: "State management" ga "AdminAuthContext" bo'limini qo'shish**

`### `AuthContext`` bo'limidan keyin qo'shing:

```markdown
### `AdminAuthContext` (alohida tizim)

Foydalanuvchi auth'idan **butunlay ajratilgan**:
- **Ikkita** token `localStorage`'da: `toilet_finder_admin_access_token`, `toilet_finder_admin_refresh_token`.
- `lib/adminApi.js#adminRequest` admin endpoint'lariga so'rov yuboradi va `401` da `POST /admin/auth/refresh` orqali avto-refresh qiladi. Refresh muvaffaqiyatsiz bo'lsa → admin tokenlari tozalanadi va `/admin/login`'ga redirect (`/login` emas).
- `useAdminAuth()` `{ admin, accessToken, loading, adminLogin, adminLogout }`'ni eksport qiladi.
- Admin va oddiy user **bir vaqtda bir browser'da** kira oladi — alohida storage kalitlari bor.
```

- [ ] **Step 4: Commit**

```bash
git add frontend/README.md
git commit -m "docs(frontend): admin panel routing va AdminAuthContext"
```

---

### Task 21: `CLAUDE.md` ni yangilash

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: "Backend request flow"'ga admin mount qaytishi haqida eslatma**

`### Backend request flow` paragrafidan keyin yangi paragraf qo'shing:

```markdown
### Admin paneli — alohida auth tizimi

Admin (kontent moderator) `/api/admin/*` route'larida ishlaydi va oddiy `User` jadvali rolida **emas** — alohida `AdminCredential` Prisma modeli va alohida `ADMIN_JWT_SECRET`'da yashaydi. Admin tokenlari foydalanuvchi tokenlari bilan o'zaro almashtirilmaydi (kriptografik jihatdan ajratilgan, secretlar har xil). Birinchi admin `prisma/seed.js` orqali `.env`'dagi `ADMIN_USERNAME`/`ADMIN_PASSWORD`'dan yaratiladi.

`adminAuthMiddleware` har so'rovda DB'dan adminni qayta o'qiydi — bu user middleware'da yo'q (perf), lekin admin uchun **ataylab** (yuqori privilege = darhol bekor qilish imkoniyati).

`controllers/adminController.js` toilet va review'lar uchun **owner check'siz** moderatsiyani amalga oshiradi. `updateToilet` mantiqi `utils/toiletValidation.js#buildToiletUpdateData`'da umumiy — `toiletController` (owner) va `adminController` (global) ikkalasi shu utility'ni ishlatadi. Sharhni o'chirgandan keyin `recalculateToiletRating` chaqirilishi kerak (xuddi `reviewController.deleteReview`'dagi kabi).
```

- [ ] **Step 2: "Auth model"'ga eslatma qo'shish**

`### Auth model (custom, not bcrypt)` bo'limining oxiriga qo'shing:

```markdown

> **Eslatma:** ADMIN endi `User.role`'ning bir qismi emas. `ALLOWED_ROLES` faqat `['USER', 'OWNER']`'ni o'z ichiga oladi. Admin auth alohida tizimda — yuqoridagi "Admin paneli" bo'limiga qarang.
```

- [ ] **Step 3: "Required env"'ga 3 ta yangi qator qo'shish**

`backend/.env` must define ro'yxatining oxiriga qo'shing:

```markdown
- `ADMIN_JWT_SECRET` — admin tokenlari uchun alohida secret (`JWT_SECRET`'dan farqli).
- `ADMIN_USERNAME` va `ADMIN_PASSWORD` — `npm run db:seed` paytida birinchi adminni yaratish uchun.
```

- [ ] **Step 4: Common commands ga `db:seed` qo'shish**

Backend `cd backend` ro'yxatining oxiriga qo'shing:

```markdown
- `npm run db:seed` — `.env`'dan birinchi admin'ni yaratish (idempotent).
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): admin panel uchun konvensiyalar va env"
```

---

## Yakuniy tasdiqlash (manual integration test)

To'liq oqimni bir marta o'tkazish:

- [ ] **Step 1: Backend va frontend ishga tushirish**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

- [ ] **Step 2: Admin login**

`http://localhost:5173/admin/login` → `admin` / `admin12345` → muvaffaqiyat → `/admin` dashboard.

- [ ] **Step 3: Hojatxona va sharh sonlari to'g'ri**

Dashboard'da hojatxonalar va sharhlar soni `GET /api/toilets` va `GET /api/admin/reviews?limit=1` natijasi bilan mos.

- [ ] **Step 4: Hojatxonalar sahifasi**

`/admin/toilets` → ro'yxat to'liq → bittasini o'chirib ko'rish → ro'yxatdan yo'qoladi.

- [ ] **Step 5: Sharhlar sahifasi**

`/admin/reviews` → ro'yxat to'liq → bittasini o'chirib ko'rish → ro'yxatdan yo'qoladi → toilet sahifasida `avg_rating` yangilangan.

- [ ] **Step 6: Logout va izolyatsiya**

"Chiqish" → `/admin/login` ga redirect → admin tokenlari `localStorage`'dan tozalandi (DevTools'da tekshirish).

- [ ] **Step 7: Cross-token ishlamasligi**

Oddiy user bo'lib kiring (`/login`). Token bilan `curl /api/admin/reviews` urinish → 401. Aksincha — admin token bilan `curl /api/auth/me` urinish → 401.

- [ ] **Step 8: Final commit (agar qo'shimcha o'zgarish bo'lsa)**

```bash
git status
# agar uncommitted o'zgarishlar bo'lsa, ularni ko'rib chiqing va kerak bo'lsa commit qiling
```

---

## Sketch: kelajak ishlari (bu plan'da yo'q)

Spec'dagi "doiradan tashqari" bo'limga mos:
- `PUT /api/admin/toilets/:id` uchun frontend edit modal/sahifasi (backend tayyor, faqat UI yo'q)
- Admin parolini o'zgartirish endpoint'i va UI
- Admin login'da rate limiting
- Audit log (kim nimani o'chirgani)
- Foydalanuvchilar ro'yxati va rolni boshqarish
