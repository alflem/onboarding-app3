// auth/options.ts
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { CustomPrismaAdapter } from "@/lib/auth/custom-prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Om en användare loggar in via Azure AD
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;

        // Om det är första inloggningen via OAuth
        if (account?.provider === "azure-ad") {
          // Hämta användarens roll från databasen istället för att använda Azure AD-roller
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id }
            });

            if (dbUser?.role) {
              // Använd rollen från databasen
              token.role = dbUser.role;
            } else {
              // Fallback till EMPLOYEE om rollen inte finns i databasen
              token.role = "EMPLOYEE";
            }
          } catch (error) {
            console.error("Fel vid hämtning av användarroll:", error);
            // Fallback till EMPLOYEE vid fel
            token.role = "EMPLOYEE";
          }
        }

        // Lägg till organization-info om det finns
        if ('organizationId' in user && user.organizationId) {
          token.organizationId = user.organizationId;
          token.organizationName = (user as any).organizationName;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;

        if (token.role) {
          session.user.role = token.role as "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
        }

        if (token.organizationId) {
          session.user.organizationId = token.organizationId as string;
          if (token.organizationName) {
            session.user.organizationName = token.organizationName as string;
            session.user.organization = {
              id: token.organizationId as string,
              name: token.organizationName as string
            };
          }
        }
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};