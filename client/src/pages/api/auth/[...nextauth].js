import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'demo_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo_client_secret',
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id || token.sub;
        token.email = user.email;
        token.name = user.name;
        token.role = 'operator';
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id || token.sub;
        session.user.role = token.role || 'operator';
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to /dashboard after successful Google OAuth sign-in
      if (url.includes('/dashboard')) return url;
      if (url.startsWith('/')) return `${baseUrl}/dashboard`;
      if (new URL(url).origin === baseUrl) return `${baseUrl}/dashboard`;
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'agentflow_super_secret_jwt_key_2026',
};

export default NextAuth(authOptions);
