import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const users = [
          {
            id: "1",
            email: "trey@michelettimedia.com",
            password: "GotWatts2026",
            name: "Trey",
            firstName: "Trey",
          },
          // Add new users below — copy the block above and change the fields
          // {
          //   id: "2",
          //   email: "jeremy@gotwatts.com",
          //   password: "ChooseAPassword",
          //   name: "Jeremy",
          //   firstName: "Jeremy",
          // },
        ];

        const user = users.find(
          (u) =>
            u.email === credentials?.email &&
            u.password === credentials?.password
        );

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName,
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.firstName = (user as { firstName?: string }).firstName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { firstName?: string }).firstName =
          token.firstName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
