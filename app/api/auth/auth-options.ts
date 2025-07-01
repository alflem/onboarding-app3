// auth/options.ts
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { CustomPrismaAdapter } from "@/lib/auth/custom-prisma-adapter";
import { updateUserOrganizationIfNeeded } from "@/lib/auth/organization-seeder";
import { prisma, type Role } from "@/lib/prisma";

// Define type for Azure AD profile
interface AzureADProfile {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  companyName?: string;
  company_name?: string;
  organization?: string;
  org?: string;
  company?: string;
  employer?: string;
}

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
        // Try multiple possible fields for company name from Azure AD
        const azureProfile = profile as AzureADProfile;
        let companyName =
          profile.companyName ||
          azureProfile.company_name ||
          azureProfile.organization ||
          azureProfile.org ||
          azureProfile.company ||
          azureProfile.employer ||
          undefined;

        // If we still don't have company name, try to extract from email domain
        if (!companyName && profile.email) {
          const domain = profile.email.split('@')[1];
          if (domain && domain !== 'outlook.com' && domain !== 'hotmail.com' && domain !== 'gmail.com') {
            // Convert domain to a reasonable company name (e.g., xlent.se -> XLENT)
            companyName = domain.split('.')[0].toUpperCase();
          }
        }

        console.log(`Azure AD profile callback - companyName: ${companyName} (from email: ${profile.email})`);

        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          companyName: companyName,
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
        const azureProfile = profile as AzureADProfile;
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
          // Only check/update organization on first login or if we don't have cached data
          const needsOrgCheck = !token.organizationId || (user && account?.provider === "azure-ad");

          if (needsOrgCheck && token.companyName) {
            console.log(`JWT callback - Checking organization for new login: ${token.companyName}`);
            try {
              await updateUserOrganizationIfNeeded(prisma, token.id, token.companyName);
            } catch (orgError) {
              console.error("Error updating user organization (continuing with login):", orgError);
              // Don't stop the login process if organization update fails
            }
          }

          // Only fetch from database if we don't have cached user data
          if (!token.role || !token.organizationId || needsOrgCheck) {
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
              token.organization = dbUser.organization ? { id: dbUser.organization.id, name: dbUser.organization.name } : undefined;

              if (needsOrgCheck) {
                console.log(`JWT callback - User ${dbUser.email} assigned to organization: ${dbUser.organization?.name} (${dbUser.organizationId})`);
              }
            } else if (needsOrgCheck) {
              console.log(`JWT callback - User with ID ${token.id} not found in database`);
            }
          }
        } catch (error) {
          console.error("Error in JWT callback (continuing with basic token):", error);
          // Don't throw the error to avoid breaking the login process
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
        session.user.organization = token.organization;
      }
      return session;
    }
  },
  pages: {
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
      name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
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