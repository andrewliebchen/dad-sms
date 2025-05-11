import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow specific email(s) from env
      const allowlist = (process.env.NEXTAUTH_ALLOWLIST || "").split(",").map(e => e.trim()).filter(Boolean);
      return allowlist.includes(user.email!);
    },
    async session({ session, token, user }) {
      // Optionally add custom session logic here
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 