import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // JWT strategy — no database needed, session stored in a signed cookie
  session: { strategy: "jwt" },

  callbacks: {
    // Persist the Google account's email/name into the JWT
    async jwt({ token, profile }) {
      if (profile) {
        token.email = profile.email ?? token.email;
        token.name = profile.name ?? token.name;
      }
      return token;
    },

    // Expose email and name on the client-side session object
    async session({ session, token }) {
      session.user.email = token.email as string;
      session.user.name = token.name as string;
      return session;
    },
  },

  // Keep session alive across browser restarts
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // 30-day persistent cookie
        maxAge: 60 * 60 * 24 * 30,
      },
    },
  },
});
