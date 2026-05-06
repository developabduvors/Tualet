# Phase 1 — Frontend ↔ Backend Parity Design

**Sana:** 2026-05-06
**Mavzu:** Toilet Finder frontend-da backend allaqachon qo'llab-quvvatlaydigan, ammo ulanmagan funksiyalarni ishga tushirish.
**Holat:** Tasdiqlangan (foydalanuvchi 2026-05-06 da tasdiqladi).
**Scope:** Faqat frontend. Backend o'zgartirilmaydi. Yangi npm dependency qo'shilmaydi.

---

## 1. Maqsad

Backend `Toilet Finder` API ko'plab funksiyalarni qo'llab-quvvatlaydi (filtrlangan yaqinlik qidiruvi, admin endpoint-lari, owner-ga tegishli toilet-larni filtrlash, 401 token-expiry signali), ammo frontend bularni faqat qisman ishlatadi yoki umuman ishlatmaydi. Ushbu spec **mavjud backend kuchini ochish** uchun aniq o'zgarishlarni belgilaydi — yangi feature-lar (xarita, image upload, push notifications) keyingi fazalarga qoldiriladi.

## 2. Hozirgi gap-lar (kuzatilgan)

| # | Gap | Backend manbai | Frontend hozirgi holati |
|---|-----|---------------|------------------------|
| 1 | 401-larda auto-logout yo'q | Har bir himoyalangan endpoint | `lib/api.js` faqat `Error` tashlaydi; foydalanuvchi token muddati tugaganda "Request failed" xatosini ko'radi |
| 2 | `/nearby` filtrlari (`type`, `maxPrice`, `minRating`, `radius`, `limit`) | `toiletController.getNearbyToilets` | `DashboardPage` faqat `lat` va `lng` yuboradi |
| 3 | Geolocation API ishlatilmagan | — | `lat`/`lng` Toshkent koordinatasi sifatida hardcoded |
| 4 | Admin panel sahifasi yo'q | `/api/admin/users`, `/api/admin/stats`, `DELETE /api/admin/users/:id` | Hech qanday UI yo'q |
| 5 | Owner uchun "Mening joylarim" ko'rinishi yo'q | `/api/toilets?ownerId=<id>` | Sahifa mavjud emas |
| 6 | Role-based routing yo'q | `authorizeRoles` backend-da bor | Faqat `ProtectedRoute` (login) bor; role tekshirilmaydi |
| 7 | Owner o'z toiletiga sharh yoza olmasligi UI-da bilinmaydi | Backend ruxsat beradi (lekin notabiiy holat) | Review form OWNER uchun yashiringan, lekin owner o'z toiletida — alohida shart kerak |

## 3. Yondashuv

**Surgical wiring** — mavjud "luxury rest" dizaynini saqlab, kichik nuqtaviy o'zgarishlar bilan backend kuchini ochish. Tanlash sababi:
- Diff kichik bo'ladi → regression xavfi past.
- Hech qanday yangi npm package qo'shilmaydi → `package.json` o'zgarmaydi.
- Faza 2 (UX polish) va Faza 3 (yangi feature-lar) ga bog'liqsiz.

Rad etilgan muqobillar:
- **Full restructure** (`pages/dashboard/` papka, alohida `Search.jsx`/`Filters.jsx`/`ResultsList.jsx`) — luxury dizaynni qayta yig'ish kerak; ortiqcha ish.
- **Type-safe API qatlami** (`lib/toilets.js`, `lib/admin.js` wrappers, JSDoc) — Faza 2 ishi; hozir hojatsiz.

## 4. O'zgarishlar bo'yicha tafsilot

### 4.1. `frontend/src/lib/api.js` — 401 auto-logout

**Muammo:** Token muddati tugaganda yoki bekor qilinganda har bir API chaqiruv "Request failed" xatosi tashlaydi. Foydalanuvchi qaerda turganini bilolmaydi.

**Yechim:**
```js
if (response.status === 401) {
  localStorage.removeItem('toilet_finder_token');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
  // Hech qanday Error tashlamaymiz — sahifa qayta yuklanyapti.
  return;
}
```

**Sababli qarorlar:**
- `AuthContext.logout()` ni import qilmaymiz — `lib/api.js` `AuthContext`-ga import qilsa **circular dependency** kelib chiqadi.
- `window.location.href` (SPA navigatsiyasi emas) — sababi: butun React state-ini reset qilish kerak. `useNavigate` faqat React tree ichida ishlaydi.
- `pathname !== '/login'` tekshiruvi — login sahifasidan login muvaffaqiyatsiz bo'lsa cheksiz redirect bo'lmasin.

### 4.2. `frontend/src/pages/DashboardPage.jsx` — Geolocation + Filters

**4.2.1. Geolocation:**

Sahifa mount bo'lgach `navigator.geolocation.getCurrentPosition` chaqiriladi.
- Muvaffaqiyatli: `setLocationForm({ lat, lng })`, badge: "📍 Real joylashuv".
- Rad etilgan / xato / timeout (5 sekund): fallback Toshkent (41.3111, 69.2797), badge: "🌆 Toshkent (standart)".
- `navigator.geolocation` mavjud bo'lmasa (eski brauzer): xuddi shu fallback.

Geolocation natijasi kelgach **avtomatik** `loadNearby()` chaqiriladi (foydalanuvchi tugma bosishi shart emas — birinchi ko'rinish darhol yaqin joylar bilan to'ladi).

**4.2.2. Filtrlar:**

Mavjud sidebar `<aside>` ichiga collapsible `<details>` element qo'shiladi (DaisyUI `collapse` klassi):
```jsx
<div className="collapse collapse-plus bg-base-200">
  <input type="checkbox" />
  <div className="collapse-title font-black uppercase text-xs tracking-widest">Filtrlar</div>
  <div className="collapse-content space-y-4">
    {/* Radius slider 0.1–50 km */}
    {/* Type checkboxes: PUBLIC, PRIVATE, PAID, FREE */}
    {/* Max price number input */}
    {/* Min rating slider 0–5 */}
  </div>
</div>
```

State shakli:
```js
const [filters, setFilters] = useState({
  radius: 5,
  types: [],         // ['PUBLIC', 'FREE']
  maxPrice: '',      // string, bo'sh bo'lsa yuborilmaydi
  minRating: 0,
});
```

`loadNearby()` query string-ni quyidagicha quradi:
```js
const params = new URLSearchParams({ lat, lng, radius: filters.radius });
if (filters.types.length) params.set('type', filters.types.join(','));
if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
if (filters.minRating > 0) params.set('minRating', filters.minRating);
```

**4.2.3. "Hammasi" tugmasi:**
Mavjud "Hammasi" tugmasi `/toilets` (filtrlanmagan) chaqiradi — bu xatti-harakatda saqlanadi.

### 4.3. Yangi: `frontend/src/pages/AdminPage.jsx`

**Tuzilish:**
1. Yuqorida 3 ta stat-card: foydalanuvchilar / hojatxonalar / sharhlar soni.
2. Foydalanuvchilar jadvali: `id`, `name`, `phone`, `role`, `createdAt`, "O'chirish" tugmasi.
3. "O'chirish" — `window.confirm` orqali tasdiqlash. Agar foydalanuvchi `id === user.id` bo'lsa, qo'shimcha matnda "Bu sizning hisobingizni ham o'chiradi va sizni tizimdan chiqaradi" deyiladi.

**Ma'lumot oqimi:**
```js
useEffect(() => { loadAll(); }, []);

async function loadAll() {
  const [statsRes, usersRes] = await Promise.all([
    request('/admin/stats'),
    request('/admin/users'),
  ]);
  setStats(statsRes.data);
  setUsers(usersRes.data || []);
}

async function deleteUser(id) {
  await request(`/admin/users/${id}`, { method: 'DELETE' });
  if (id === currentUser.id) {
    logout(); // Auth context-dan
  } else {
    loadAll();
  }
}
```

### 4.4. Yangi: `frontend/src/pages/MyToiletsPage.jsx`

**Maqsad:** OWNER va ADMIN o'zining toilet-larini bitta joyda ko'rishi va boshqarishi.

**Tuzilish:**
- Sarlavha + "+ Yangi qo'shish" CTA tugma (`/create-toilet`-ga).
- Grid: dashboard-dagi card-ga o'xshash, lekin har birida "Tahrirlash" va "O'chirish" tugmalari.
- Bo'sh holat: "Hali joy qo'shmagansiz, birinchi qo'shing".

**Endpoint:** `GET /api/toilets?ownerId=<user.id>` — `getAllToilets` allaqachon `ownerId` filterini qo'llab-quvvatlaydi.

### 4.5. Yangi: `frontend/src/components/RoleProtectedRoute.jsx`

```jsx
export default function RoleProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/" />;

  return children;
}
```

**Sababli qaror:** `ProtectedRoute` saqlanib qoladi (login-only sahifalar uchun). `RoleProtectedRoute` alohida — ikkalasini birlashtirish (single component with optional `roles`) abstraksiyasini orttirib, yengilroq holatni murakkablashtiradi.

### 4.6. `frontend/src/App.jsx` — Yangi route-lar

```jsx
<Route path="/admin" element={
  <RoleProtectedRoute roles={['ADMIN']}>
    <AdminPage />
  </RoleProtectedRoute>
} />
<Route path="/my-toilets" element={
  <RoleProtectedRoute roles={['OWNER', 'ADMIN']}>
    <MyToiletsPage />
  </RoleProtectedRoute>
} />
```

### 4.7. `frontend/src/components/Layout.jsx` — Role-based menu

Avatar dropdown ichida shartli `<li>`-lar:
```jsx
{(user.role === 'OWNER' || user.role === 'ADMIN') && (
  <li><Link to="/my-toilets">Mening joylarim</Link></li>
)}
{user.role === 'ADMIN' && (
  <li><Link to="/admin">Admin panel</Link></li>
)}
<li><button onClick={logout}>Chiqish</button></li>
```

### 4.8. `frontend/src/pages/ToiletDetailPage.jsx` — Owner o'z toiletiga sharh yozmasligi

**Hozirgi shart:** `user?.role === 'USER'` → review form ko'rinadi.

**Yangi shart:** `user?.role === 'USER' && user.id !== toilet.ownerId` — ammo USER toilet egasi bo'lolmaydi (faqat OWNER/ADMIN), shuning uchun bu chek aslida hojatsiz. **Lekin** OWNER va ADMIN ham boshqalarning toilet-lariga sharh qoldira olmaydi (backend faqat USER ga ruxsat beradi). Shuning uchun **hozirgi UI to'g'ri** — qo'shimcha o'zgartirish kerak emas.

> **Qaror:** Bu nuqtani **olib tashlaymiz** spec-dan. Muammo yo'q ekan.

## 5. Edge case-lar va xato holatlari

| Holatlar | Xatti-harakat |
|---|---|
| Geolocation rad etiladi | Fallback Toshkent koordinatasi, badge bilan ko'rsatiladi |
| Geolocation 5s da javob bermaydi | Timeout, fallback ishlatiladi |
| Token muddati tugagan (har qanday endpoint-da 401) | `localStorage` tozalanadi, `/login`-ga redirect |
| Filtrlar nol natija beradi | Mavjud "Hozircha bo'sh" empty state |
| ADMIN o'zini o'chiradi | Confirm-da ogohlantirish, o'chirgach `logout()` chaqiriladi |
| ADMIN sahifasiga USER kiradi | `RoleProtectedRoute` `/`-ga tashlaydi |
| Owner-ning toilet-i yo'q | `MyToiletsPage` empty state |
| `/admin/users` da foydalanuvchi parolsiz qaytadi | Backend allaqachon parolni filtrlaydi (`adminController.getAllUsers` `select` ishlatadi) — UI hech narsa qilmasligi shart |

## 6. Testlash rejasi (manual)

Test runner yo'q (`package.json` da `test` script ham, jest/vitest dependency ham yo'q). **Manual smoke test** bajariladi:

1. Logout → `/admin` → `/login`-ga redirect.
2. USER login → `/admin` → `/`-ga redirect.
3. ADMIN login → `/admin` → stats ko'rinadi, foydalanuvchini o'chirish ishlaydi.
4. ADMIN o'zini o'chiradi → token tozalanadi, `/login`-da.
5. OWNER login → `/my-toilets` → faqat o'zinikilar.
6. Token-ni DevTools orqali noto'g'ri qiymatga o'zgartirish + sahifa yangilash → auto-logout.
7. Brauzerda geolocation rad qilish → fallback Toshkent ishlaydi, badge ko'rinadi.
8. Filterda `type=FREE` + `minRating=4` qo'yish → query string `/nearby?lat=...&lng=...&radius=5&type=FREE&minRating=4` ekanini Network tab-da tekshirish.
9. Filtrlar bilan nol natija → empty state ko'rinadi.
10. Token muddati tugaganligini simulyatsiya qilish (manual o'chirish), keyin biror himoyalangan amal (POST /toilets) → `/login`-ga redirect.

## 7. Faylga oid xulosa

| Fayl | Ish | Taxminiy qator |
|---|---|---|
| `frontend/src/lib/api.js` | Edit | +6 |
| `frontend/src/pages/DashboardPage.jsx` | Edit | +90 / -25 |
| `frontend/src/pages/AdminPage.jsx` | **Yangi** | ~140 |
| `frontend/src/pages/MyToiletsPage.jsx` | **Yangi** | ~95 |
| `frontend/src/components/RoleProtectedRoute.jsx` | **Yangi** | ~18 |
| `frontend/src/App.jsx` | Edit | +12 |
| `frontend/src/components/Layout.jsx` | Edit | +10 |

**Backend:** o'zgartirilmaydi.
**Dependencies:** o'zgartirilmaydi.

## 8. Qabul mezonlari

1. ✅ Token muddati tugaganda foydalanuvchi avtomatik `/login`-da paydo bo'ladi.
2. ✅ Dashboard yuklanishi bilan brauzer joylashuvini so'raydi va birinchi ko'rinish yaqin joylar bilan to'ladi.
3. ✅ Sidebar-da to'liq filtr to'plami: radius, type, maxPrice, minRating.
4. ✅ ADMIN sahifasi: stats, users jadvali, delete tugmasi.
5. ✅ OWNER (yoki ADMIN) "Mening joylarim" sahifasini ko'ra oladi.
6. ✅ USER `/admin` yoki `/my-toilets`-ga kirolmaydi.
7. ✅ Layout dropdown rol asosida tegishli linklarni ko'rsatadi.

## 9. Bu spec-ga **kirmaydi** (Faza 2/3 uchun qoldirilgan)

- Toast notification (`react-hot-toast` yoki shu kabi)
- Loading skeleton-lar
- Form validation kutubxonasi (react-hook-form / zod)
- Xarita integratsiyasi (Leaflet / Google Maps)
- Image upload (multer + cloudinary)
- Push notifications
- i18n
- Mobil ilova (React Native)

## 10. Tasdiqlash

- [x] Foydalanuvchi 2026-05-06 da dizaynni tasdiqladi.
- [ ] Foydalanuvchi spec-ni o'qib chiqdi.
- [ ] writing-plans skill orqali implementation plan tuzilgan.
