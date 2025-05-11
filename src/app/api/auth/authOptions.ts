import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allowlist = (process.env.NEXTAUTH_ALLOWLIST || "")
        .split(",")
        .map(e => e.trim())
        .filter(Boolean);
      return allowlist.includes(user.email!);
    },
    async session({ session }) {
      return session;
    },
  },
}; 