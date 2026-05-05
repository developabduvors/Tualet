# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two-package project (no root workspace). Install and run each side independently:

- `backend/` — Node 20+, Express 4, Prisma 6, SQLite, Socket.io 4 (CommonJS, `require`).
- `frontend/` — React 19 + Vite 8 + Tailwind 4 + DaisyUI 5 (ESM, `import`).

There is no root `package.json`; do not add scripts at the root unless asked.

## Common commands

Backend (`cd backend`):
- `npm install` — install dependencies.
- `npm run dev` — start API + Socket.io with nodemon on `http://localhost:5000`.
- `npm start` — production-style run.
- `npm run prisma:generate` — regenerate the Prisma client (run after editing `prisma/schema.prisma`).
- `npm run prisma:migrate` — apply a new migration to `prisma/dev.db`.

Frontend (`cd frontend`):
- `npm install`
- `npm run dev` — Vite dev server on `http://localhost:5173`.
- `npm run build` / `npm run preview`
- `npm run lint` — ESLint (flat config). There is no test runner configured in either package.

There is no top-level `test` script and no test framework installed — do not invent one when asked to "run tests"; report the absence instead.

## Required env

`backend/.env` must define:
- `DATABASE_URL` — **absolute** SQLite path, e.g. `file:C:/Users/admin/Desktop/Toilet/backend/prisma/dev.db`. Relative paths break Prisma on Windows here (see `PROJECT_SUMMARY.md` troubleshooting).
- `JWT_SECRET` — used by `utils/jwt.js` and verified in `middlewares/authMiddleware.js`.
- `PORT` — optional, defaults to `5000`.

The frontend hardcodes `http://localhost:5000` in `src/lib/api.js` and `src/context/SocketContext.jsx` — if you change the backend port or host, update both.

## Architecture — the parts that span files

### Backend request flow
`server.js` boots an `http.Server`, attaches Socket.io to it, and mounts the Express `app` from `app.js`. `app.js` only wires middleware (`cors`, `express.json`), the `/api/health` ping, four route modules (`/api/auth`, `/api/toilets`, `/api/reviews`, `/api/admin`), and a tail error handler that returns `{ success, message }`. All controllers follow the same `try { ... } catch (error) { next(error); }` shape and emit `{ success, message, data | count }` — preserve this envelope when adding endpoints.

### Auth model (custom, not bcrypt)
`utils/password.js` uses `crypto.scryptSync` and stores credentials as `"<salt>:<hash>"`. Do **not** swap in bcrypt without migrating existing rows. `utils/jwt.js` mints tokens that embed `id`, `phone`, and `role`; `authMiddleware.authenticateToken` decodes them onto `req.user`, and `authorizeRoles(...)` is composable per route.

Roles are validated in two places that must stay in sync:
- `authController.js` `ALLOWED_ROLES = ['USER', 'OWNER', 'ADMIN']` (registration gate — note the comment says "USER or OWNER" but ADMIN is allowed too).
- `prisma/schema.prisma` declares enums for documentation, but **SQLite stores them as plain `String`** (`role String @default("USER")`, same for `Toilet.status`/`type`). Controllers normalise inputs with `String(value).toUpperCase()` — keep doing this rather than relying on DB-level enum enforcement.

### Toilet domain
- Owners create toilets (`POST /api/toilets` requires `OWNER`); `updateToilet` / `deleteToilet` only check `toilet.ownerId === req.user.id` — admins cannot edit others' toilets through this route.
- `images` is stored as a JSON-encoded string on the row and unwrapped through `utils/serializers.js#formatToilet`. Always go through `formatToilet` / `formatReview` before returning rows so the client receives arrays.
- `Toilet.avg_rating` is an application-maintained denormalised field. **Never write to it directly** — call `utils/ratings.js#recalculateToiletRating(tx, toiletId)` inside a `prisma.$transaction`. It is invoked from `createReview`, `deleteReview`, and `adminController.deleteUser` (the latter snapshots affected toilet IDs before the cascade so stale ratings can be recomputed).
- `getNearbyToilets` does a two-stage filter: a SQL bounding-box prefilter (uses the `@@index([lat, lng])` btree) followed by an in-memory Haversine pass (`utils/haversine.js`) for exact radius. Accepts `lat`, `lng`, `radius` (default 5 km, clamped 0.1–50), `limit` (default 50, max 100), plus optional `type` (comma-separated), `maxPrice`, `minRating`. Includes `owner {id, name}` in each result.

### Realtime chat
Socket.io lives in `server.js` (not in a separate module). Each authenticated user joins `user_<id>` via `join_personal_room`; `send_message` emits to the receiver's room **and** echoes back to the sender so the sender's UI updates without a local append. There is no persistence — messages exist only for connected sockets.

On the frontend, `SocketContext` connects when an auth user is present, joins the personal room, and accumulates every `receive_message` into a single global `chatMessages` array. Per-conversation filtering is the consumer's responsibility (e.g. `ToiletDetailPage`). Disconnect happens on logout via the `user` effect dependency.

### Frontend composition
`main.jsx` → `<BrowserRouter><AuthProvider><SocketProvider><AppRoutes/>` — `SocketProvider` depends on `AuthProvider`, do not reorder. `AuthContext` persists the JWT in `localStorage` under `toilet_finder_token` and refetches `/auth/me` whenever the token changes; `lib/api.js#request` reads the same key for every call. `ProtectedRoute` in `App.jsx` only gates `/create-toilet` and `/toilets/:id/edit` — `/toilets/:id` and the dashboard are public.

### Styling
Tailwind 4 + DaisyUI 5 via `@tailwindcss/vite`. There is no `tailwind.config.*` — configuration lives inline in `src/index.css` per Tailwind 4 conventions. Don't add a v3-style config.

## Conventions worth preserving
- Backend stays CommonJS (`"type": "commonjs"`); frontend stays ESM. Don't mix.
- API responses always use `{ success: boolean, message?: string, data?: any, count?: number }`.
- Prisma is accessed through the singleton in `backend/src/config/prisma.js` — import that, do not `new PrismaClient()` elsewhere.
- After editing `schema.prisma`, run both `prisma:migrate` and `prisma:generate`; the dev DB lives at `backend/prisma/dev.db` and is committed.

## Reference
`PROJECT_SUMMARY.md` (root) is a Uzbek-language project brief and troubleshooting guide; consult it for setup pitfalls (Prisma `P6001/P1001`, `EADDRINUSE` on 5000/5173, DaisyUI CSS not loading).

<!-- cloude-code-toolbox:mcp-skills-awareness-begin -->

### MCP & Skills awareness (Cloude Code ToolBox)

_Last synced: 2026-05-04T17:11:58.231Z._

- **Full report:** `.claude/cloude-code-toolbox-mcp-skills-awareness.md` in this workspace (auto-overwritten on each scan). Use it as ground truth for configured servers and skill folders.
- **MCP:** For **live tools** in Claude Code, enable the matching server via `/mcp` (and VS Code `mcp.json` where applicable).
- **When the user’s task matches a server** (e.g. Confluence work and a **Confluence** / **Atlassian** MCP is listed), **prefer that server id** and plan on tool use—not only file search.
- **Skills:** Folders below contain `SKILL.md`; attach or cite paths in chat when relevant.

#### Workspace MCP

- `c:\Users\user\Desktop\toiletProject\.vscode\mcp.json` _(workspace: toiletProject)_ — _file missing_

_No active workspace servers in mcp.json._

#### User MCP

- `C:\Users\user\AppData\Roaming\Code\User\mcp.json` — _file missing_

_No active user-scoped servers in mcp.json._

#### Project skills

_None found (or no workspace open)._

#### User skills

_None found._

<!-- cloude-code-toolbox:mcp-skills-awareness-end -->
