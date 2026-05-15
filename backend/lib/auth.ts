/**
 * Toilet.uz — NextAuth (Auth.js v5) konfiguratsiyasi
 * --------------------------------------------------------------------------
 * Asosiy chiqishlar:
 *   handlers  → app/api/auth/[...nextauth]/route.ts  uchun GET, POST
 *   auth()    → route va server component'larda session olish
 *   signIn / signOut  → server action'lar uchun
 *   requireSession()  → himoyalangan API endpointlar uchun helper
 */

import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

const providers: NextAuthConfig['providers'] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  );
}

// Oddiy email/parol bilan kirish
providers.push(
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Parol', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      });

      if (!user?.passwordHash) return null;

      const isValid = await bcrypt.compare(
        credentials.password as string,
        user.passwordHash
      );

      if (!isValid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  })
);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the URL is relative, redirect to the frontend
      if (url.startsWith('/')) {
        return `${FRONTEND_URL}${url}`;
      }
      // If already pointing to frontend, allow it
      if (url.startsWith(FRONTEND_URL)) {
        return url;
      }
      // If pointing to backend, allow it (e.g. OAuth callback)
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default: go to frontend home
      return FRONTEND_URL;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/* ────────────  Server-side helpers  ──────────── */

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return { user: session.user as { id: string; name?: string | null; email?: string | null; image?: string | null } };
}

/* ────────────  Type augmentation  ──────────── */

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
