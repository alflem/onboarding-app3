// auth/options.ts
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { CustomPrismaAdapter } from "@/lib/auth/custom-prisma-adapter";
import { PrismaClient, Role } from "@prisma/client";

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
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          companyName: profile.companyName || (profile as any).company_name || undefined,
        };
      },
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Set user data on first login
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.companyName = user.companyName || undefined;
      }

      // Try to get company name from Azure AD profile
      if (account?.provider === "azure-ad" && profile) {
        const azureProfile = profile as any;
        if (azureProfile.companyName || azureProfile.company_name) {
          token.companyName = azureProfile.companyName || azureProfile.company_name;
        } else if (account.access_token) {
          try {
            // Try to get company name from Microsoft Graph API
            const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me?$select=companyName,department', {
              headers: {
                'Authorization': `Bearer ${account.access_token}`,
                'Content-Type': 'application/json',
              },
            });

            if (graphResponse.ok) {
              const graphData = await graphResponse.json();
              if (graphData.companyName) {
                token.companyName = graphData.companyName;
              } else if (graphData.department) {
                token.companyName = graphData.department;
              }
            }
          } catch (error) {
            console.error("Error fetching company information:", error);
          }
        }
      }

      // Get user role and organization from database
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            include: {
              organization: true
            }
          });

          if (dbUser) {
            token.role = dbUser.role;
            token.organizationId = dbUser.organizationId ?? undefined;
            token.organizationName = (dbUser.organization?.name as string | undefined);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role as Role;
        session.user.organizationId = token.organizationId;
        session.user.organizationName = token.organizationName;
        session.user.companyName = token.companyName;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
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
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
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