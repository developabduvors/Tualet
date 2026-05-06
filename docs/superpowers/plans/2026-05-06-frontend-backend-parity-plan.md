# Frontend ↔ Backend Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend allaqachon qo'llab-quvvatlaydigan, ammo frontend-da ulanmagan funksiyalarni ochish — geolocation + nearby filtrlari, admin paneli, "Mening joylarim", 401 auto-logout, role-based routing.

**Architecture:** Surgical wiring — mavjud "luxury rest" dizayni saqlanadi. 7 ta fayl o'zgartiriladi/yaratiladi, 0 ta yangi npm dependency, backend o'zgarmaydi. Har bir task alohida commit.

**Tech Stack:** React 19 + Vite 8 + Tailwind 4 + DaisyUI 5 + react-router-dom 7. Bu loyihada **test runner yo'q** (`package.json` da `test` script ham, jest/vitest dependency ham yo'q) — CLAUDE.md test framework qo'shmaslikni aniq aytadi. Verifikatsiya **manual smoke test** orqali (browser DevTools Network/Console tab-lari).

**Spec:** `docs/superpowers/specs/2026-05-06-frontend-backend-parity-design.md`

---

## File Structure

| Fayl | Mas'uliyat | Status |
|---|---|---|
| `frontend/src/lib/api.js` | HTTP wrapper. Yangi mas'uliyat: 401 markaziy handling. | Edit |
| `frontend/src/components/RoleProtectedRoute.jsx` | Login + role tekshiruvi guard. | **Yangi** |
| `frontend/src/pages/AdminPage.jsx` | Admin stats + users CRUD UI. | **Yangi** |
| `frontend/src/pages/MyToiletsPage.jsx` | Owner/Admin uchun shaxsiy toilet ro'yxati. | **Yangi** |
| `frontend/src/App.jsx` | Yangi route-lar (`/admin`, `/my-toilets`). | Edit |
| `frontend/src/components/Layout.jsx` | Avatar dropdown — role-based menyu. | Edit |
| `frontend/src/pages/DashboardPage.jsx` | Geolocation + filter UI. | Edit |

**Task tartibi sababi:** API qatlami → guard component → guarded sahifalar → routing → UI menyu → eng katta o'zgarish (Dashboard) oxirida. Har task oldingisiga tayanmaydi (bog'liq emas), shuning uchun cherry-pick yoki rebase oson.

---

## Task 1: 401 Auto-Logout Handler

**Files:**
- Modify: `frontend/src/lib/api.js`

**Maqsad:** Har qanday himoyalangan endpoint 401 qaytarsa, token tozalash va `/login`-ga redirect.

- [ ] **Step 1: `lib/api.js` ni yangilash**

`frontend/src/lib/api.js` ni quyidagicha to'liq qaytadan yozing:

```js
const API_BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'toilet_finder_token';

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Sessiya tugadi, qayta kiring');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export { API_BASE_URL, request };
```

**Eslatma:** `Error` hali ham tashlanadi — sababi: `await request(...)` chaqiruvi 401-da ham mantiqiy "muvaffaqiyatli" qaytmasligi kerak; chaqiruvchi kod `try/catch` ichida turibdi va davom etib qolmaydi. Lekin sahifa yangilanmoqda, shuning uchun bu xato faqat bir lahza ko'rinadi.

- [ ] **Step 2: Manual smoke test**

1. Backend ishlayotganiga ishonch hosil qiling (`cd backend && npm run dev`).
2. Frontend ishga tushiring (`cd frontend && npm run dev`).
3. Login bo'ling (USER yoki OWNER).
4. DevTools → Application → Local Storage → `toilet_finder_token` qiymatini noto'g'ri matnga (masalan `"broken"`) o'zgartiring.
5. Sahifani yangilang.
6. **Kutilgan:** `/login`-ga avtomatik o'tasiz, localStorage-da `toilet_finder_token` yo'q.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api.js
git commit -m "feat(api): 401 auto-logout va token tozalash"
```

---

## Task 2: RoleProtectedRoute Component

**Files:**
- Create: `frontend/src/components/RoleProtectedRoute.jsx`

**Maqsad:** Login + role kombinatsiyasini tekshirib, mos kelmasa redirect qiluvchi guard komponent.

- [ ] **Step 1: Komponentni yaratish**

`frontend/src/components/RoleProtectedRoute.jsx`:

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

**Sababli qarorlar:**
- `replace` flag — foydalanuvchi back tugmasi orqali himoyalangan sahifaga qayta urilmaydi.
- `loading` holatida spinner — `AuthContext` `/auth/me` chaqirayotgan paytda redirect qilmaslik (false negative oldini olish).

- [ ] **Step 2: Manual smoke test**

Bu task hali route-larga ulangan emas, shuning uchun smoke test Task 3 da bajariladi. Hozir faqat **lint** tekshiriladi:

```bash
cd frontend && npm run lint
```

**Kutilgan:** Hech qanday ESLint xatosi yo'q.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/RoleProtectedRoute.jsx
git commit -m "feat(auth): RoleProtectedRoute komponent qo'shildi"
```

---

## Task 3: AdminPage va `/admin` route

**Files:**
- Create: `frontend/src/pages/AdminPage.jsx`
- Modify: `frontend/src/App.jsx`

**Maqsad:** ADMIN uchun stats + users jadvali + delete tugmasi.

- [ ] **Step 1: AdminPage komponentini yaratish**

`frontend/src/pages/AdminPage.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        request('/admin/stats'),
        request('/admin/users')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    const isSelf = id === user.id;
    const confirmText = isSelf
      ? `"${name}" — bu sizning hisobingiz! O'chirsangiz tizimdan chiqasiz va barcha joylaringiz/sharhlaringiz yo'qoladi. Davom etasizmi?`
      : `"${name}" foydalanuvchisini va uning barcha joylari/sharhlarini o'chirmoqchimisiz?`;

    if (!window.confirm(confirmText)) return;

    try {
      await request(`/admin/users/${id}`, { method: 'DELETE' });
      if (isSelf) {
        logout();
      } else {
        loadAll();
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <p className="text-xs font-bold text-primary tracking-widest uppercase">Boshqaruv</p>
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Admin panel</h1>
      </div>

      {message && (
        <div className="alert alert-error">
          <span>{message}</span>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-primary text-primary-content shadow-xl">
            <div className="card-body">
              <p className="text-xs uppercase font-bold opacity-70 tracking-widest">Foydalanuvchilar</p>
              <p className="text-5xl font-black">{stats.users}</p>
            </div>
          </div>
          <div className="card bg-secondary text-secondary-content shadow-xl">
            <div className="card-body">
              <p className="text-xs uppercase font-bold opacity-70 tracking-widest">Hojatxonalar</p>
              <p className="text-5xl font-black">{stats.toilets}</p>
            </div>
          </div>
          <div className="card bg-neutral text-neutral-content shadow-xl">
            <div className="card-body">
              <p className="text-xs uppercase font-bold opacity-70 tracking-widest">Sharhlar</p>
              <p className="text-5xl font-black">{stats.reviews}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl border border-base-content/5">
        <div className="card-body">
          <h2 className="card-title text-2xl font-black uppercase mb-4">Foydalanuvchilar</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ism</th>
                  <th>Telefon</th>
                  <th>Rol</th>
                  <th>Yaratilgan</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-mono text-xs opacity-50">{u.id}</td>
                    <td className="font-bold">{u.name}{u.id === user.id && <span className="badge badge-primary badge-sm ml-2">Siz</span>}</td>
                    <td className="font-mono text-sm">{u.phone}</td>
                    <td>
                      <span className={`badge font-bold ${
                        u.role === 'ADMIN' ? 'badge-error' :
                        u.role === 'OWNER' ? 'badge-warning' : 'badge-ghost'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-xs opacity-60">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-error btn-xs"
                        onClick={() => handleDelete(u.id, u.name)}
                      >
                        O'chirish
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 opacity-40 italic">Foydalanuvchi yo'q</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `App.jsx`-ga route qo'shish**

`frontend/src/App.jsx` ning import qismiga qo'shing:

```jsx
import RoleProtectedRoute from './components/RoleProtectedRoute';
import AdminPage from './pages/AdminPage';
```

`<Routes>` ichida (boshqa route-lardan keyin) qo'shing:

```jsx
<Route path="/admin" element={
  <RoleProtectedRoute roles={['ADMIN']}>
    <AdminPage />
  </RoleProtectedRoute>
} />
```

- [ ] **Step 3: Manual smoke test**

1. Backend va frontend ishlayotganiga ishonch hosil qiling.
2. **Test 3a — login bo'lmaganda:** `http://localhost:5173/admin` → `/login`-ga redirect bo'lishi kerak.
3. **Test 3b — USER rolida:** USER bilan login qiling → `/admin` → `/`-ga redirect.
4. **Test 3c — ADMIN rolida:** ADMIN bilan login qiling (yo'q bo'lsa, DB-da `User` rolini `ADMIN` ga manualy o'zgartiring yoki Prisma Studio-dan: `cd backend && npx prisma studio`).
5. ADMIN-da `/admin` → 3 ta stat-card va users jadvali ko'rinishi kerak.
6. **Test 3d — boshqa user-ni o'chirish:** Test foydalanuvchisini o'chiring → confirm-dan keyin jadvaldan g'oyib bo'ladi, stats yangilanadi.
7. **Test 3e — o'zini o'chirish:** ADMIN o'zini o'chiradi → maxsus matnli confirm → `/login`-ga tashlanadi.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/AdminPage.jsx frontend/src/App.jsx
git commit -m "feat(admin): admin paneli qo'shildi (stats + users CRUD)"
```

---

## Task 4: MyToiletsPage va `/my-toilets` route

**Files:**
- Create: `frontend/src/pages/MyToiletsPage.jsx`
- Modify: `frontend/src/App.jsx`

**Maqsad:** Owner/Admin o'z toilet-larini ko'radi va boshqaradi.

- [ ] **Step 1: MyToiletsPage yaratish**

`frontend/src/pages/MyToiletsPage.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function MyToiletsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMine();
  }, [user?.id]);

  async function loadMine() {
    if (!user) return;
    try {
      setLoading(true);
      const response = await request(`/toilets?ownerId=${user.id}`);
      setToilets(response.data || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`"${name}" joyini o'chirmoqchimisiz?`)) return;
    try {
      await request(`/toilets/${id}`, { method: 'DELETE' });
      loadMine();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-bold text-primary tracking-widest uppercase">Sizning joylaringiz</p>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Mening joylarim</h1>
          <p className="text-xs font-bold opacity-40 mt-2 tracking-widest uppercase">{toilets.length} ta joy</p>
        </div>
        <button
          className="btn btn-primary font-black shadow-lg shadow-primary/20"
          onClick={() => navigate('/create-toilet')}
        >
          + Yangi joy qo'shish
        </button>
      </div>

      {message && (
        <div className="alert alert-error">
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : toilets.length === 0 ? (
        <div className="py-32 text-center bg-base-100 rounded-[3rem] border-2 border-dashed border-base-content/10">
          <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl opacity-50">🚽</div>
          <h3 className="text-2xl font-black uppercase opacity-40">Hali joy qo'shmagansiz</h3>
          <p className="text-sm opacity-30 mt-2 max-w-xs mx-auto italic">Birinchi joyingizni qo'shib, foydalanuvchilarga taqdim qiling.</p>
          <button
            className="btn btn-primary mt-6"
            onClick={() => navigate('/create-toilet')}
          >
            + Yangi joy qo'shish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {toilets.map((item) => (
            <div
              key={item.id}
              className="bg-base-100 rounded-[2rem] p-6 shadow-xl border border-base-content/5"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-black tracking-tight leading-tight max-w-[70%]">
                  {item.name}
                </h3>
                <div className={`badge badge-lg font-black border-none py-4 px-4 ${
                  item.status === 'OPEN' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}>
                  {item.status}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-base-200/50 p-3 rounded-2xl">
                  <p className="text-[10px] uppercase font-black opacity-30 tracking-widest mb-1">Narxi</p>
                  <p className="font-bold text-sm">{item.price} so'm</p>
                </div>
                <div className="bg-base-200/50 p-3 rounded-2xl">
                  <p className="text-[10px] uppercase font-black opacity-30 tracking-widest mb-1">Reyting</p>
                  <p className="font-bold text-sm">⭐ {item.avg_rating || 0}</p>
                </div>
                <div className="bg-base-200/50 p-3 rounded-2xl">
                  <p className="text-[10px] uppercase font-black opacity-30 tracking-widest mb-1">Turi</p>
                  <p className="font-bold text-sm">{item.type}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-base-content/5">
                <button
                  className="btn btn-sm btn-ghost flex-1"
                  onClick={() => navigate(`/toilets/${item.id}`)}
                >
                  Ko'rish
                </button>
                <button
                  className="btn btn-sm btn-outline flex-1"
                  onClick={() => navigate(`/toilets/${item.id}/edit`)}
                >
                  Tahrirlash
                </button>
                <button
                  className="btn btn-sm btn-error btn-outline flex-1"
                  onClick={() => handleDelete(item.id, item.name)}
                >
                  O'chirish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `App.jsx`-ga route qo'shish**

Import qismi:
```jsx
import MyToiletsPage from './pages/MyToiletsPage';
```

`<Routes>` ichida:
```jsx
<Route path="/my-toilets" element={
  <RoleProtectedRoute roles={['OWNER', 'ADMIN']}>
    <MyToiletsPage />
  </RoleProtectedRoute>
} />
```

- [ ] **Step 3: Manual smoke test**

1. **Test 4a — USER:** USER login → `/my-toilets` → `/`-ga redirect.
2. **Test 4b — OWNER (joysiz):** Yangi OWNER ro'yxatdan o'ting, hech qanday joy qo'shmang → `/my-toilets` → "Hali joy qo'shmagansiz" empty state.
3. **Test 4c — OWNER (joy bilan):** OWNER orqali bir nechta joy yarating → `/my-toilets` → faqat o'zinikilar grid-da ko'rinadi.
4. **Test 4d — Tahrirlash:** Card-dagi "Tahrirlash" → `/toilets/:id/edit`-ga o'tadi.
5. **Test 4e — O'chirish:** "O'chirish" → confirm → joy g'oyib bo'ladi, qolganlari qoladi.
6. **Test 4f — Network:** DevTools Network tab → `GET /api/toilets?ownerId=<id>` chaqiruvi ko'rinishi kerak.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/MyToiletsPage.jsx frontend/src/App.jsx
git commit -m "feat(owner): mening joylarim sahifasi qo'shildi"
```

---

## Task 5: Layout — Role-based menu

**Files:**
- Modify: `frontend/src/components/Layout.jsx`

**Maqsad:** Avatar dropdown rol asosida tegishli linklarni ko'rsatadi.

- [ ] **Step 1: Layout.jsx-ni o'zgartirish**

`frontend/src/components/Layout.jsx` da `Link`-ni import qismida saqlang. Avatar dropdown qismini quyidagicha o'zgartiring (faqat `<ul>` blokini almashtiring):

```jsx
<ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-56">
  <li className="menu-title text-xs opacity-60">{user.name} ({user.role})</li>
  <li><Link to="/">Bosh sahifa</Link></li>
  {(user.role === 'OWNER' || user.role === 'ADMIN') && (
    <li><Link to="/my-toilets">Mening joylarim</Link></li>
  )}
  {user.role === 'ADMIN' && (
    <li><Link to="/admin">Admin panel</Link></li>
  )}
  <li><button onClick={logout}>Chiqish</button></li>
</ul>
```

- [ ] **Step 2: Manual smoke test**

1. **Test 5a — USER:** USER bilan login → avatar bosing → menyuda "Bosh sahifa" + "Chiqish". "Mening joylarim" va "Admin panel" yo'q.
2. **Test 5b — OWNER:** OWNER bilan login → menyuda "Bosh sahifa" + "Mening joylarim" + "Chiqish". "Admin panel" yo'q.
3. **Test 5c — ADMIN:** ADMIN bilan login → menyuda hammasi: "Bosh sahifa" + "Mening joylarim" + "Admin panel" + "Chiqish".
4. Har bir link bosib ko'ring — to'g'ri sahifaga o'tishi kerak.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Layout.jsx
git commit -m "feat(layout): rolga asoslangan dropdown menyu"
```

---

## Task 6: Dashboard — Geolocation va Filters

**Files:**
- Modify: `frontend/src/pages/DashboardPage.jsx`

**Maqsad:** Sahifa yuklanishi bilan brauzer joylashuvini olish, sidebar-da to'liq filtr to'plami (radius, type, maxPrice, minRating).

- [ ] **Step 1: DashboardPage.jsx ni qaytadan yozish**

Bu fayl katta o'zgarishga ega. Quyidagi to'liq tarkib bilan almashtiring:

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const TASHKENT = { lat: 41.3111, lng: 69.2797 };
const TOILET_TYPES = ['PUBLIC', 'PRIVATE', 'PAID', 'FREE'];

export default function DashboardPage() {
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [coords, setCoords] = useState(TASHKENT);
  const [coordsSource, setCoordsSource] = useState('default'); // 'default' | 'real'
  const [filters, setFilters] = useState({
    radius: 5,
    types: [],
    maxPrice: '',
    minRating: 0,
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  // 1. Geolocation request on mount
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      loadNearby(TASHKENT, filters);
      return;
    }

    const timeoutId = setTimeout(() => {
      // Timeout fallback — geolocation 5s ichida javob bermasa
      loadNearby(TASHKENT, filters);
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId);
        const real = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(real);
        setCoordsSource('real');
        loadNearby(real, filters);
      },
      () => {
        clearTimeout(timeoutId);
        loadNearby(TASHKENT, filters);
      },
      { timeout: 5000, maximumAge: 60000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadNearby(c = coords, f = filters) {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        lat: String(c.lat),
        lng: String(c.lng),
        radius: String(f.radius),
      });
      if (f.types.length) params.set('type', f.types.join(','));
      if (f.maxPrice !== '' && !Number.isNaN(Number(f.maxPrice))) {
        params.set('maxPrice', String(Number(f.maxPrice)));
      }
      if (f.minRating > 0) params.set('minRating', String(f.minRating));

      const response = await request(`/toilets/nearby?${params.toString()}`);
      setToilets(response.data || []);
      setMessage(`${response.count || 0} ta joy topildi`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAll() {
    try {
      setLoading(true);
      const response = await request('/toilets');
      setToilets(response.data || []);
      setMessage(`${response.data?.length || 0} ta joy (filtrlanmagan)`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleType(t) {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(t)
        ? prev.types.filter((x) => x !== t)
        : [...prev.types, t],
    }));
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-primary px-8 py-12 text-primary-content shadow-2xl shadow-primary/30">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">Eng yaqin va toza joyni toping</h2>
          <p className="text-lg opacity-90 mb-8 max-w-lg leading-relaxed">
            Biz sizga Toshkentdagi barcha jamoat va xususiy hojatxonalarni topishga yordam beramiz.
            Reytinglar, rasmlar va narxlarni solishtiring.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="badge badge-secondary badge-lg font-bold gap-2 py-4 px-6">
              <span className="text-xs uppercase opacity-70">Jami:</span> {toilets.length} ta joy
            </div>
            <div className="badge badge-lg font-bold gap-2 py-4 px-6 bg-white/10 border-white/20 text-primary-content">
              {coordsSource === 'real' ? '📍 Real joylashuv' : '🌆 Toshkent (standart)'}
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute right-20 -bottom-20 w-60 h-60 bg-secondary/20 rounded-full blur-3xl"></div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 items-start">
        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden">
            <div className="p-1 bg-gradient-to-r from-primary to-secondary"></div>
            <div className="card-body gap-6">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight flex justify-between items-center">
                  Qidiruv
                  <button className="btn btn-ghost btn-xs text-primary font-bold" onClick={loadAll}>Hammasi</button>
                </h3>
                <p className="text-xs opacity-50 font-medium">Joylashuvingiz bo'yicha qidiring</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-[10px] uppercase font-black opacity-40 tracking-widest">Lat</span></label>
                    <input
                      className="input input-bordered w-full bg-base-200 border-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                      value={coords.lat}
                      onChange={(e) => { setCoords({ ...coords, lat: e.target.value }); setCoordsSource('default'); }}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-[10px] uppercase font-black opacity-40 tracking-widest">Lng</span></label>
                    <input
                      className="input input-bordered w-full bg-base-200 border-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                      value={coords.lng}
                      onChange={(e) => { setCoords({ ...coords, lng: e.target.value }); setCoordsSource('default'); }}
                    />
                  </div>
                </div>

                {/* Filters accordion */}
                <div className="collapse collapse-plus bg-base-200/60 rounded-2xl">
                  <input type="checkbox" />
                  <div className="collapse-title font-black uppercase text-xs tracking-widest">Filtrlar</div>
                  <div className="collapse-content space-y-5">
                    <div>
                      <label className="label py-1">
                        <span className="label-text text-[10px] uppercase font-black opacity-60 tracking-widest">Radius: {filters.radius} km</span>
                      </label>
                      <input
                        type="range" min="0.5" max="50" step="0.5"
                        value={filters.radius}
                        onChange={(e) => setFilters({ ...filters, radius: Number(e.target.value) })}
                        className="range range-primary range-xs"
                      />
                    </div>

                    <div>
                      <label className="label py-1">
                        <span className="label-text text-[10px] uppercase font-black opacity-60 tracking-widest">Turi</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TOILET_TYPES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleType(t)}
                            className={`btn btn-xs rounded-full ${filters.types.includes(t) ? 'btn-primary' : 'btn-ghost bg-base-100'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="label py-1">
                        <span className="label-text text-[10px] uppercase font-black opacity-60 tracking-widest">Maks. narx (so'm)</span>
                      </label>
                      <input
                        type="number" min="0"
                        placeholder="Cheklov yo'q"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                        className="input input-bordered input-sm w-full bg-base-100"
                      />
                    </div>

                    <div>
                      <label className="label py-1">
                        <span className="label-text text-[10px] uppercase font-black opacity-60 tracking-widest">Min. reyting: {filters.minRating > 0 ? `⭐ ${filters.minRating}` : 'cheklov yo\'q'}</span>
                      </label>
                      <input
                        type="range" min="0" max="5" step="0.5"
                        value={filters.minRating}
                        onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                        className="range range-secondary range-xs"
                      />
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-block shadow-lg shadow-primary/20 h-14 text-lg font-black tracking-wide"
                  onClick={() => loadNearby()}
                  disabled={loading}
                >
                  {loading ? <span className="loading loading-spinner"></span> : 'Qidirish'}
                </button>
              </div>
            </div>
          </div>

          {user?.role === 'OWNER' && (
            <div className="card bg-neutral text-neutral-content shadow-xl">
              <div className="card-body p-6">
                <h3 className="card-title text-lg uppercase font-black">Ega bo'limi</h3>
                <p className="text-xs opacity-70">O'z joyingizni qo'shing va boshqaring</p>
                <button
                  className="btn btn-secondary btn-sm mt-2 w-full font-bold"
                  onClick={() => navigate('/my-toilets')}
                >
                  Mening joylarim
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className="alert alert-info py-3 px-4 rounded-2xl shadow-lg border-none bg-info/10 text-info font-bold text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>{message}</span>
            </div>
          )}
        </aside>

        {/* Results */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Natijalar</h2>
              <p className="text-xs font-bold opacity-40 mt-2 tracking-widest uppercase">Hozirda {toilets.length} ta joy mavjud</p>
            </div>
            <div className="join bg-base-100 shadow-md p-1 rounded-xl">
              <button className="btn btn-ghost btn-sm join-item btn-active">Grid</button>
              <button className="btn btn-ghost btn-sm join-item opacity-40">List</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {toilets.map((item) => (
              <div
                key={item.id}
                className="group relative bg-base-100 rounded-[2rem] p-6 shadow-xl hover:shadow-2xl transition-all duration-500 border border-base-content/5 cursor-pointer overflow-hidden"
                onClick={() => navigate(`/toilets/${item.id}`)}
              >
                <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-black tracking-tight leading-tight max-w-[70%] group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <div className={`badge badge-lg font-black border-none py-4 px-4 ${
                      item.status === 'OPEN' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                    }`}>
                      {item.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-base-200/50 p-3 rounded-2xl">
                      <p className="text-[10px] uppercase font-black opacity-30 tracking-widest mb-1">Narxi</p>
                      <p className="font-bold text-lg">{item.price} <span className="text-xs opacity-50">so'm</span></p>
                    </div>
                    <div className="bg-base-200/50 p-3 rounded-2xl">
                      <p className="text-[10px] uppercase font-black opacity-30 tracking-widest mb-1">Reyting</p>
                      <p className="font-bold text-lg">⭐ {item.avg_rating || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-base-content/5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <span className="text-xs font-black uppercase opacity-40">{item.type}</span>
                    </div>
                    {item.distance !== undefined && (
                      <span className="text-sm font-black text-primary bg-primary/10 py-1 px-3 rounded-lg">
                        {item.distance.toFixed(2)} km
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {toilets.length === 0 && !loading && (
              <div className="col-span-full py-32 text-center bg-base-100 rounded-[3rem] border-2 border-dashed border-base-content/10">
                <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl opacity-50">🚽</div>
                <h3 className="text-2xl font-black uppercase opacity-40">Hozircha bo'sh</h3>
                <p className="text-sm opacity-30 mt-2 max-w-xs mx-auto italic">Bu hududda hech qanday joy topilmadi. Filtrlarni o'zgartirib ko'ring.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual smoke test**

1. **Test 6a — Geolocation ruxsat:** Brauzer-da `localhost:5173` ni ochasiz. Brauzer joylashuv so'raydi → "Allow" bosing → badge "📍 Real joylashuv" ko'rinishi kerak.
2. **Test 6b — Geolocation rad:** Browser settings-da geolocation rad qiling yoki incognito-da → 5s ichida fallback ishlaydi → badge "🌆 Toshkent (standart)".
3. **Test 6c — Filtr accordion:** Sidebar-dagi "Filtrlar" bosing → ochiladi → 4 ta filtr ko'rinadi.
4. **Test 6d — Type filter:** "FREE" + "PUBLIC" tanlang → "Qidirish" → DevTools Network → query string-da `type=FREE,PUBLIC` bo'lishi kerak.
5. **Test 6e — Min rating:** Slider-ni 4 ga olib boring → "Qidirish" → query-da `minRating=4`.
6. **Test 6f — Radius:** Slider-ni 1 km ga olib keling → "Qidirish" → query-da `radius=1`.
7. **Test 6g — Max price:** "1000" yozing → "Qidirish" → query-da `maxPrice=1000`.
8. **Test 6h — "Hammasi":** "Hammasi" tugmasi bosing → `/toilets` chaqiriladi (filtrlanmagan).
9. **Test 6i — OWNER karta:** OWNER login → sidebar-da "Mening joylarim" CTA → bosib `/my-toilets`-ga o'tadi.
10. **Test 6j — distance:** Real geolocation bilan kartochkalarda `X.XX km` ko'rinishi kerak.

- [ ] **Step 3: Lint**

```bash
cd frontend && npm run lint
```

**Kutilgan:** Hech qanday xato yo'q. Agar `react-hooks/exhaustive-deps` warning chiqsa — biz uni qasddan disable qildik (mount-da bir marta), bu OK.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/DashboardPage.jsx
git commit -m "feat(dashboard): geolocation va nearby filtrlari qo'shildi"
```

---

## Task 7: Final integratsiya smoke test

**Files:** Hech qanday fayl o'zgarmaydi — bu **end-to-end manual smoke test**. Spec-dagi 10 ta test nuqtasini bir-bir bajarish.

- [ ] **Step 1: Backend va frontend ni ishga tushiring**

Ikki terminal:
```bash
cd backend && npm run dev
```
```bash
cd frontend && npm run dev
```

- [ ] **Step 2: Spec-dagi 10 ta nuqtani bajaring**

Spec `docs/superpowers/specs/2026-05-06-frontend-backend-parity-design.md` ning **6-bo'limi** ("Testlash rejasi") dagi 1–10 punktni hammasini bajaring. Har birida natijani belgilang:

- [ ] 1. Logout → `/admin` → `/login`-ga redirect
- [ ] 2. USER → `/admin` → `/`-ga redirect
- [ ] 3. ADMIN → `/admin` → stats + users + delete ishlaydi
- [ ] 4. ADMIN o'zini o'chiradi → token tozalanadi, `/login`-da
- [ ] 5. OWNER → `/my-toilets` → faqat o'zinikilar
- [ ] 6. Token-ni manualy buzish + sahifa yangilash → auto-logout
- [ ] 7. Geolocation rad qilish → fallback Toshkent + badge
- [ ] 8. `type=FREE` + `minRating=4` → query string Network tab-da to'g'ri
- [ ] 9. Filtrlar nol natija → empty state
- [ ] 10. Token-ni manualy o'chirib, POST /toilets sinash → `/login`-ga redirect

- [ ] **Step 3: Agar barcha testlar muvaffaqiyatli — final commit yo'q**

Bu task hech qanday kod o'zgartirmaydi. Agar test paytida bug topilsa, mos task-ga qaytib tuzatish kerak.

---

## Self-Review Notlar

**Spec coverage:**
- ✅ Section 4.1 (401 handler) → Task 1
- ✅ Section 4.2 (Geolocation + Filters) → Task 6
- ✅ Section 4.3 (AdminPage) → Task 3
- ✅ Section 4.4 (MyToiletsPage) → Task 4
- ✅ Section 4.5 (RoleProtectedRoute) → Task 2
- ✅ Section 4.6 (App.jsx route-lar) → Task 3 + Task 4
- ✅ Section 4.7 (Layout role menu) → Task 5
- ✅ Section 4.8 (ToiletDetailPage) → spec'da "o'zgartirish kerak emas" deyildi, plan-da ham yo'q
- ✅ Section 6 testlash → Task 7

**Placeholder scan:** Tekshirildi — barcha kod bloklari to'liq, "TODO"/"TBD" yo'q.

**Type consistency:** `coords` shapesi `{lat, lng}` hamma joyda. `filters` shapesi `{radius, types, maxPrice, minRating}` hamma joyda. `request()` signature o'zgarmagan.

**Test framework yo'qligi:** Standart writing-plans skill TDD ga yo'naltirilgan, lekin bu loyihada test runner yo'q (CLAUDE.md aniq aytadi). Verifikatsiya **manual smoke test** orqali — har task-da aniq browser/Network tekshiruvlari berilgan.
