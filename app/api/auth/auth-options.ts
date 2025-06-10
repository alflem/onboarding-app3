// auth/options.ts
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { CustomPrismaAdapter } from "@/lib/auth/custom-prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Updated to trigger database reset and Demo Company creation
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
    async jwt({ token, user, account }) {
      // Set basic user data on first login
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;

        // Store organization info if available from user object
        if ('organizationId' in user && user.organizationId) {
          token.organizationId = user.organizationId;
          token.organizationName = (user as { organizationName?: string }).organizationName;
        }
      }

      // On first Azure AD login, fetch user data from database
      if (account?.provider === "azure-ad" && user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              organization: true
            }
          });

          // Set role from database or fallback to EMPLOYEE
          token.role = dbUser?.role || "EMPLOYEE";

          // Set organization info from database
          if (dbUser?.organization) {
            token.organizationId = dbUser.organization.id;
            token.organizationName = dbUser.organization.name;
          } else {
            // Ensure Demo Company exists and assign user to it
            let demoOrg = await prisma.organization.findFirst({
              where: { name: "Demo Company" }
            });

            if (!demoOrg) {
              demoOrg = await prisma.organization.create({
                data: {
                  name: "Demo Company",
                  buddyEnabled: true,
                }
              });
            }

            // Update user with Demo Company
            await prisma.user.update({
              where: { id: user.id },
              data: { organizationId: demoOrg.id }
            });

            token.organizationId = demoOrg.id;
            token.organizationName = demoOrg.name;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Set fallback values
          token.role = "EMPLOYEE";
          token.organizationId = "demo";
          token.organizationName = "Demo Company";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Always set basic user data from token
        session.user.id = token.id as string;
        session.user.role = (token.role as "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE") || "EMPLOYEE";

        // Set organization data from token (populated during JWT callback)
        if (token.organizationId && token.organizationName) {
          session.user.organizationId = token.organizationId as string;
          session.user.organizationName = token.organizationName as string;
          session.user.organization = {
            id: token.organizationId as string,
            name: token.organizationName as string
          };
        } else {
          // Fallback organization if token doesn't have org data
          session.user.organizationId = "demo";
          session.user.organizationName = "Demo Company";
          session.user.organization = {
            id: "demo",
            name: "Demo Company"
          };
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
  debug: process.env.NODE_ENV !== "production",
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
};