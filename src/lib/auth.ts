import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Instructor Login',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'admin' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Simple credential check against environment variables
        const validUsername = process.env.INSTRUCTOR_USERNAME || 'admin';
        const validPassword = process.env.INSTRUCTOR_PASSWORD;

        if (!validPassword) {
          console.error('INSTRUCTOR_PASSWORD not set in environment');
          return null;
        }

        if (
          credentials?.username === validUsername &&
          credentials?.password === validPassword
        ) {
          return {
            id: '1',
            name: 'Instructor',
            email: 'instructor@simulation.local',
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/instructor/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
};

// Helper to check if user is authenticated on server
export function isInstructor(session: { user?: { id?: string } } | null): boolean {
  return session?.user?.id === '1';
}
