import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? 'mnaikorea.com';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') return false;

      const email = user.email ?? profile?.email;
      if (!email) return false;

      const domain = email.split('@')[1]?.toLowerCase();
      if (domain !== ALLOWED_DOMAIN) {
        return `/login?error=domain`;
      }

      // Google Workspace `hd` claim도 검증 (개인 Gmail이 도메인 사칭 못 하도록)
      const hd = (profile as { hd?: string } | undefined)?.hd;
      if (hd && hd.toLowerCase() !== ALLOWED_DOMAIN) {
        return `/login?error=domain`;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

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

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
  }
}
