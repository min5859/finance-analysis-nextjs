import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? 'mnaikorea.com';
const GOOGLE_ENABLED = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;

const providers: NextAuthConfig['providers'] = [
  // 임시 게이트: 회사 이메일 주소만 입력하면 통과. 비밀번호 없음.
  // Google OAuth 자격증명을 받으면 이 provider 를 비활성화하거나 보조용으로 둘 예정.
  Credentials({
    id: 'email',
    name: '이메일',
    credentials: {
      email: { label: '이메일', type: 'email' },
    },
    async authorize(credentials) {
      const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
      if (!email) return null;
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) return null;

      // PrismaAdapter는 Credentials provider 의 user 자동 생성을 지원하지 않으므로 직접 upsert.
      const user = await prisma.user.upsert({
        where: { email },
        create: { email, name: email.split('@')[0] },
        update: {},
      });

      return { id: user.id, email: user.email, name: user.name };
    },
  }),
];

if (GOOGLE_ENABLED) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: { prompt: 'select_account' },
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Credentials provider 는 authorize() 에서 이미 검증했으므로 통과.
      if (account?.provider === 'email' || account?.type === 'credentials') {
        return true;
      }

      if (account?.provider !== 'google') return false;

      const email = user.email ?? profile?.email;
      if (!email) return false;

      const domain = email.split('@')[1]?.toLowerCase();
      if (domain !== ALLOWED_DOMAIN) return `/login?error=domain`;

      const hd = (profile as { hd?: string } | undefined)?.hd;
      if (hd && hd.toLowerCase() !== ALLOWED_DOMAIN) return `/login?error=domain`;

      return true;
    },

    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
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
