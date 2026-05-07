# Toilet Finder — Frontend

React 19 + Vite 8 + Tailwind 4 + DaisyUI 5 + react-router-dom 7 + socket.io-client. Bu hujjat frontend papkasida **hozirgi paytda nima borligini** sanab beradi.

> Loyiha umumiy tavsifi va backend API ma'lumotnomasi uchun: ildizdagi `PROJECT_SUMMARY.md`.
> Texnik konvensiyalar uchun: ildizdagi `CLAUDE.md`.
> Backend tafsilotlari: `backend/README.md`.

---

## Texnologiyalar

- **React 19.2** — ESM (`"type": "module"`)
- **Vite 8** + **@vitejs/plugin-react** — dev server, HMR, build
- **Tailwind CSS 4** — `@tailwindcss/vite` plugin orqali; `tailwind.config.*` **yo'q** (Tailwind 4 konvensiyasi — sozlash `index.css` ichida).
- **DaisyUI 5** — komponent kutubxonasi
- **react-router-dom 7** — routing
- **socket.io-client 4** — realtime chat

---

## Buyruqlar (`cd frontend`)

```bash
npm install              # bog'liqliklarni o'rnatish
npm run dev              # Vite dev server, http://localhost:5173
npm run build            # production bundle
npm run preview          # bundle'ni preview qilish
npm run lint             # ESLint (flat config)
```

Test runner **o'rnatilmagan** — `npm test` mavjud emas.

---

## Backend manzili (hardcoded)

Frontend `http://localhost:5000` ni 2 joyda ishlatadi — port/host o'zgarsa **ikkalasini** yangilash kerak:

| Fayl | Maqsad |
|---|---|
| `src/lib/api.js` | `API_BASE_URL = 'http://localhost:5000/api'` (refresh oqimi `/auth/refresh` ga ham boradi) |
| `src/context/SocketContext.jsx` | `io('http://localhost:5000')` |

---

## Papka tuzilishi

```text
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx                  # Navbar (rolga qarab dropdown menyu) + footer
│   │   └── RoleProtectedRoute.jsx      # roles=[...] bilan route gating
│   ├── context/
│   │   ├── AuthContext.jsx             # JWT + user (localStorage), loadCurrentUser
│   │   └── SocketContext.jsx           # socket + chatMessages + sendMessage
│   ├── lib/
│   │   └── api.js                      # request() — Bearer token, 401 auto-logout
│   ├── pages/
│   │   ├── DashboardPage.jsx           # geolocation + nearby filter (radius/type/maxPrice/minRating)
│   │   ├── ToiletDetailPage.jsx        # ma'lumot + sharhlar + chat
│   │   ├── CreateToiletPage.jsx        # yangi joy (OWNER/ADMIN)
│   │   ├── EditToiletPage.jsx          # tahrirlash (egasi/ADMIN)
│   │   ├── MyToiletsPage.jsx           # owner.id orqali "mening joylarim"
│   │   ├── AdminPage.jsx               # /admin/stats + /admin/users CRUD
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── App.jsx                         # BrowserRouter + AuthProvider + SocketProvider + AppRoutes
│   ├── main.jsx                        # createRoot + 'daisyui/daisyui.css' + './index.css'
│   └── index.css                       # @import "tailwindcss" + @theme + animatsiyalar + glass-panel
├── index.html
├── vite.config.js                      # tailwindcss() + react()
├── package.json
└── eslint.config.js                    # ESLint flat config
```

---

## Provider iyerarxiyasi

`main.jsx` → `App.jsx`:

```
<BrowserRouter>
  <AuthProvider>          ← JWT, foydalanuvchi
    <SocketProvider>      ← Socket.io (user.id ga bog'liq)
      <AppRoutes />
    </SocketProvider>
  </AuthProvider>
</BrowserRouter>
```

> ⚠️ `SocketProvider` `AuthProvider` ichida bo'lishi shart — `useAuth().user` ga bog'liq. **Tartibni o'zgartirmang.**

---

## Routing (`App.jsx`)

| Yo'l | Komponent | Himoya |
|---|---|---|
| `/` | `DashboardPage` | — (umumiy) |
| `/login` | `LoginPage` | — |
| `/register` | `RegisterPage` | — |
| `/toilets/:id` | `ToiletDetailPage` | — (umumiy) |
| `/create-toilet` | `CreateToiletPage` | `RoleProtectedRoute roles={['OWNER','ADMIN']}` |
| `/toilets/:id/edit` | `EditToiletPage` | `RoleProtectedRoute roles={['OWNER','ADMIN']}` |
| `/my-toilets` | `MyToiletsPage` | `RoleProtectedRoute roles={['OWNER','ADMIN']}` |
| `/admin` | `AdminPage` | `RoleProtectedRoute roles={['ADMIN']}` |

`RoleProtectedRoute`:
- `loading` → spinner
- `!user` → `/login` ga redirect
- `!roles.includes(user.role)` → `/` ga redirect

---

## State management

### `AuthContext`
- **Ikkita** token `localStorage` da: `toilet_finder_access_token` va `toilet_finder_refresh_token`.
- `accessToken` state o'zgarsa, `useEffect` `/auth/me` ni qayta yuklaydi.
- `user`, `accessToken`, `loading`, `login(accessToken, refreshToken)`, `logout()`, `setUser` ekspoz qiladi.
- Token persistlikni `lib/api.js#setTokens`/`clearTokens` boshqaradi (yagona manba).

### `SocketContext`
- `user` o'zgarsa, eski socket'ni `disconnect` qiladi va yangisini yaratadi.
- Ulanganda `join_personal_room` orqali `user.id` xonasiga kiradi.
- Har qanday `receive_message` ni global `chatMessages` massiviga qo'shadi.
- **Per-conversation filtering — sahifa ishi** (masalan, `ToiletDetailPage` sender/receiver bo'yicha filterlaydi).
- `sendMessage(receiverId, text)` — `Number(receiverId)` ga konvertatsiya qiladi (backend uchun majburiy).

### API layer (`lib/api.js`)
- Yagona `request(path, options)` — `Authorization: Bearer <accessToken>` ni avto-qo'shadi.
- **Avto-refresh oqimi**: `401` kelsa, `tryRefresh()` orqali `POST /auth/refresh` ga refresh token yuborilib, yangi juftlik olinadi va so'rov **qayta urinadi**. Faqat refresh ham muvaffaqiyatsiz bo'lsa → tokenlar tozalanadi va `/login` ga to'liq sahifa redirecti.
- `/auth/login`, `/auth/register`, `/auth/refresh` endpointlarida refresh urinmaydi (cheksiz tsikl xavfini oldini olish).
- JSON parse'ning xatosida bo'sh obyekt fallback.
- Eksport: `request`, `setTokens(access, refresh)`, `clearTokens()`, `getAccessToken()`.

---

## Styling

### Tailwind 4 sozlash (`index.css`)
- `@import "tailwindcss";` — Tailwind 4'ning yangi entry sintaksisi.
- `@theme { --font-sans, --font-display }` — CSS o'zgaruvchilari orqali fontlar.
- **Hech qanday `tailwind.config.*` fayli yo'q.** Tailwind 4 konvensiyasi shu — v3-uslubdagi config qo'shmang.

### DaisyUI 5
- `main.jsx` da `import 'daisyui/daisyui.css'` orqali ulanadi.
- Tailwind plugin sifatida emas — alohida CSS sifatida (DaisyUI 5 uslubi).

### Maxsus utility'lar (`index.css`)
| Class | Effekt |
|---|---|
| `.glass-panel` | `backdrop-filter: blur(16px)` + transparent fon — navbar va dropdown'da |
| `.card-hover` | hover'da `translateY(-4px)` + soya |
| `.blob` | dekorativ rangli xira aylanalar |
| `.animate-fade-in-up`, `.animate-fade-in`, `.animate-slide-down`, `.animate-pulse-glow` | reusable animatsiyalar |
| `.stagger > *` | bolalarga `nth-child` orqali animation-delay (60ms qadam bilan 8 bola gacha) |

`h1, h2, h3` `--font-display` (Space Grotesk) ishlatadi, qolganlari `--font-sans` (Inter).

---

## Sahifalarning asosiy harakatlari

### `DashboardPage`
- **Geolocation**: `navigator.geolocation.getCurrentPosition` chaqiradi; 5 sekunda javob bo'lmasa, fallback sifatida Toshkent koordinatalari (`41.3111, 69.2797`) ishlatiladi.
- Filtrlar: `radius`, `types[]` (vergul bilan join qilinadi), `maxPrice`, `minRating` — barchasi `GET /api/toilets/nearby` ga uzatiladi.
- Natijalarda `distance` allaqachon backenddan saralangan holda keladi.

### `ToiletDetailPage`
- Parallel `Promise.all` — `/toilets/:id` va `/reviews/toilet/:id`.
- Sharh formasi: `rating` (1–5), `comment`, `quick_feedback[]` — masalan `['Toza','Arzon','Qulay','Navbat bor','Sovun bor']`.
- Chat: `useSocket().chatMessages` ni sender/receiver bo'yicha filterlab ko'rsatadi; `sendMessage(toilet.owner.id, text)` qiladi.

### `MyToiletsPage`
- `GET /api/toilets?ownerId=${user.id}` — backend `getAllToilets` ownerId filtrini qo'llab-quvvatlaydi.

### `AdminPage`
- `Promise.all` bilan `/admin/stats` va `/admin/users` ni bir vaqtda yuklaydi.

---

## So'nggi frontend commitlari

- `d4f9779` — yangi o'zgarishlar
- `bae9d7c` — `/create-toilet` va `/toilets/:id/edit` faqat OWNER/ADMIN uchun
- `c7da0da` — Dashboard'ga geolocation va nearby filtrlari
- `5284928` — Layout: rolga asoslangan dropdown menyu
- `0dd4b5e` — `MyToiletsPage` qo'shildi (owner uchun)
- `2490e34` — Admin paneli (stats + users CRUD)
- `f778654` — `RoleProtectedRoute` komponenti
- `28a2865` — API'da 401 auto-logout va token tozalash
