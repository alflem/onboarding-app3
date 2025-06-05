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
    async jwt({ token, user, account, profile: _profile }) {
      // Om en användare loggar in via Azure AD
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;

        // Om det är första inloggningen via OAuth
        if (account?.provider === "azure-ad") {
          // Hämta användarens roll och organisation från databasen
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              include: {
                organization: true
              }
            });

            if (dbUser?.role) {
              // Använd rollen från databasen
              token.role = dbUser.role;
            } else {
              // Fallback till EMPLOYEE om rollen inte finns i databasen
              token.role = "EMPLOYEE";
            }

            // Lägg till organisation-info
            if (dbUser?.organization) {
              token.organizationId = dbUser.organization.id;
              token.organizationName = dbUser.organization.name;
            }
          } catch (error) {
            console.error("Fel vid hämtning av användarroll:", error);
            // Fallback till EMPLOYEE vid fel
            token.role = "EMPLOYEE";
          }
        }

        // Lägg till organization-info om det finns (för befintliga tokens)
        if ('organizationId' in user && user.organizationId) {
          token.organizationId = user.organizationId;
          token.organizationName = (user as { organizationName?: string }).organizationName;
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

        // Ensure organization is always set
        if (token.organizationId && token.organizationName) {
          session.user.organizationId = token.organizationId as string;
          session.user.organizationName = token.organizationName as string;
          session.user.organization = {
            id: token.organizationId as string,
            name: token.organizationName as string
          };
        } else {
          // If no organization is found in token, try to fetch from database
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: session.user.id },
              include: {
                organization: true
              }
            });

            if (dbUser?.organization) {
              session.user.organizationId = dbUser.organization.id;
              session.user.organizationName = dbUser.organization.name;
              session.user.organization = {
                id: dbUser.organization.id,
                name: dbUser.organization.name
              };
            } else {
              // If still no organization, this shouldn't happen with our fix
              throw new Error("User must have an organization");
            }
          } catch (error) {
            console.error("Error fetching user organization:", error);
            throw new Error("User must have an organization");
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
  secret: process.env.AUTH_SECRET,
};