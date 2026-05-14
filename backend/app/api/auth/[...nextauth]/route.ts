/**
 * NextAuth catch-all route — handlers'ni `lib/auth.ts`'dan import qiladi.
 * URL'lar avtomatik tarzda yaratiladi:
 *   GET  /api/auth/signin
 *   POST /api/auth/signin/:provider
 *   GET  /api/auth/callback/:provider
 *   POST /api/auth/signout
 *   GET  /api/auth/session
 *   GET  /api/auth/providers
 *   GET  /api/auth/csrf
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;

export const runtime = 'nodejs';
