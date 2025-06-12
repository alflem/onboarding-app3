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
          scope: "openid profile email User.Read"
        }
      },
      profile(profile) {
        console.log("Azure AD Profile:", profile);
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          companyName: profile.companyName || profile.company_name,
        };
      },
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      console.log("JWT Callback - Provider:", account?.provider, "User Email:", user?.email || token.email);

      // Set basic user data on first login
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;

        // Store company name from Azure AD profile
        if ('companyName' in user && user.companyName) {
          token.companyName = user.companyName as string;
          console.log("Company name from profile:", user.companyName);
        }

        // Store organization info if available from user object
        if ('organizationId' in user && user.organizationId) {
          token.organizationId = user.organizationId;
          token.organizationName = (user as { organizationName?: string }).organizationName;
        }
      }

      // On Azure AD login, also check the profile for company information
      if (account?.provider === "azure-ad" && profile) {
        const azureProfile = profile as any;
        if (azureProfile.companyName || azureProfile.company_name) {
          token.companyName = azureProfile.companyName || azureProfile.company_name;
          console.log("Company name from Azure AD profile:", token.companyName);
        }
      }

      // Always fetch user data from database to ensure correct role
      // This is important for Safari which might not preserve JWT tokens properly
      if (token.id) {
        console.log("Fetching user data from database for token refresh...");
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: {
              organization: true
            }
          });

          if (dbUser) {
            console.log(`Database user found: ${dbUser.email} with role: ${dbUser.role}`);
            // Always update role from database to ensure accuracy
            token.role = dbUser.role;

            // Set organization info from database
            if (dbUser.organization) {
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
                where: { id: token.id as string },
                data: { organizationId: demoOrg.id }
              });

              token.organizationId = demoOrg.id;
              token.organizationName = demoOrg.name;
            }
          } else {
            console.error(`Database user not found for ID: ${token.id}, this should not happen`);
            // If database user not found, something went wrong - keep existing role or use fallback
            token.role = token.role || "ADMIN";
            token.organizationId = token.organizationId || "demo";
            token.organizationName = token.organizationName || "Demo Company";
          }
        } catch (error) {
          console.error("Error fetching user from database:", error);
          // On database error, keep existing token role or use fallback
          token.role = token.role || "ADMIN";
          token.organizationId = token.organizationId || "demo";
          token.organizationName = token.organizationName || "Demo Company";
        }
      }

      // For subsequent requests (when user is already in token), maintain the role
      console.log(`Final token role: ${token.role} for user: ${token.email}`);
      return token;
    },
    async session({ session, token }) {
      console.log("Session Callback - Token:", {
        id: token.id,
        email: token.email,
        role: token.role,
        organizationId: token.organizationId
      });

      if (session.user) {
        // Always set basic user data from token
        session.user.id = token.id as string;

        // If no role in token, fetch from database as fallback
        if (!token.role && token.id) {
          console.log("No role in token, fetching from database...");
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { role: true }
            });

            if (dbUser) {
              console.log(`Fetched role from database: ${dbUser.role}`);
              session.user.role = dbUser.role;
            } else {
              console.log("No database user found, using ADMIN fallback");
              session.user.role = "ADMIN";
            }
          } catch (error) {
            console.error("Error fetching role from database in session callback:", error);
            session.user.role = "ADMIN";
          }
        } else {
          session.user.role = (token.role as "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE") || "ADMIN";
        }

        console.log(`Final session role: ${session.user.role} for user: ${session.user.id}`);

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

        // Set company name from token if available
        if (token.companyName) {
          session.user.companyName = token.companyName as string;
          console.log("Setting company name in session:", token.companyName);
        }
      }

      console.log("Final session:", {
        userId: session.user?.id,
        role: session.user?.role,
        organizationId: session.user?.organizationId
      });

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
  debug: process.env.NODE_ENV === "development", // Enable debug in development
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // Add domain explicitly for better Safari compatibility
        domain: process.env.NODE_ENV === "production" ? undefined : undefined,
      }
    },
    // Add explicit callback URL cookie for Safari
    callbackUrl: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      }
    },
    // Add CSRF token cookie for Safari
    csrfToken: {
      name: process.env.NODE_ENV === "production" ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      }
    }
  },
};