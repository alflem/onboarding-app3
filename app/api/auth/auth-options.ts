// auth/options.ts
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { updateUserOrganizationIfNeeded } from "@/lib/auth/organization-seeder";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// Simplified function to map Azure AD roles to application roles
function mapAzureRoleToAppRole(azureRoles: string[] | undefined): Role {
  if (!azureRoles || azureRoles.length === 0) {
    return Role.EMPLOYEE;
  }

  // Check for super admin role first
  if (azureRoles.some(role => role.toLowerCase().includes('super_admin') || role.toLowerCase().includes('superadmin'))) {
    return Role.SUPER_ADMIN;
  }

  // Check for admin role
  if (azureRoles.some(role => role.toLowerCase().includes('admin'))) {
    return Role.ADMIN;
  }

  return Role.EMPLOYEE;
}

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
  roles?: string[];
}

// Updated to support hybrid Azure AD role management
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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

        // Simple role mapping - only use roles if they exist in the profile
        const azureRoles = azureProfile.roles || [];
        const mappedRole = mapAzureRoleToAppRole(azureRoles);
        const isAzureManaged = azureRoles.length > 0;

        console.log(`Azure AD login - user: ${profile.email}, company: ${companyName}, roles: ${JSON.stringify(azureRoles)}, mapped: ${mappedRole}`);

        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          companyName: companyName,
          role: mappedRole,
          isAzureManaged: isAzureManaged,
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
        token.role = user.role || Role.EMPLOYEE;
        token.isAzureManaged = user.isAzureManaged || false;
      }

      // Try to get company name from Azure AD profile if needed
      if (account?.provider === "azure-ad" && profile && !token.companyName) {
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
          // Only check/update organization after user exists in database
          const needsOrgCheck = !token.organizationId;

          // Fetch user from database
          if (needsOrgCheck) {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id },
              include: {
                organization: true
              }
            });

            if (dbUser) {
              // Ensure user has an organization - critical for app functionality
              if (!dbUser.organizationId) {
                console.log(`User ${dbUser.email} has no organization - attempting to fix...`);
                try {
                  // Try to find or create Demo Company as fallback
                  let demoOrg = await prisma.organization.findFirst({
                    where: { name: "Demo Company" }
                  });

                  if (!demoOrg) {
                    console.log("Creating Demo Company organization...");
                    demoOrg = await prisma.organization.create({
                      data: {
                        name: "Demo Company",
                        buddyEnabled: true,
                      },
                    });
                  }

                  // Assign user to Demo Company
                  await prisma.user.update({
                    where: { id: token.id },
                    data: {
                      organizationId: demoOrg.id
                    }
                  });

                  // Refresh user data
                  const updatedUser = await prisma.user.findUnique({
                    where: { id: token.id },
                    include: { organization: true }
                  });

                  if (updatedUser) {
                    dbUser.organizationId = updatedUser.organizationId;
                    dbUser.organization = updatedUser.organization;
                  }

                  console.log(`User ${dbUser.email} assigned to Demo Company`);
                } catch (orgFixError) {
                  console.error("Failed to assign user to organization:", orgFixError);
                  // Continue without throwing error to allow login
                }
              }

              // Update user's role and Azure status if needed (hybrid approach)
              if (token.role && (dbUser.role !== token.role || dbUser.isAzureManaged !== token.isAzureManaged)) {
                await prisma.user.update({
                  where: { id: token.id },
                  data: {
                    role: token.role,
                    isAzureManaged: token.isAzureManaged || false
                  }
                });
              }

              // For hybrid management: Use Azure role if user is Azure-managed, otherwise use DB role
              token.role = token.isAzureManaged ? token.role : dbUser.role;
              token.organizationId = dbUser.organizationId ?? undefined;
              token.organizationName = (dbUser.organization?.name as string | undefined);
              token.organization = dbUser.organization ? { id: dbUser.organization.id, name: dbUser.organization.name } : undefined;

              console.log(`JWT callback - User ${dbUser.email} found with organization: ${dbUser.organization?.name} (${dbUser.organizationId}) with role: ${token.role} (Azure managed: ${token.isAzureManaged})`);
            } else {
              // User doesn't exist yet - this happens during account creation
              console.log(`JWT callback - User with ID ${token.id} not found in database yet`);
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
        session.user.isAzureManaged = token.isAzureManaged;
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
  events: {
    createUser: async (message) => {
      console.log("User created:", message.user.email);
    },
    signIn: async (message) => {
      console.log("Sign in:", message.user.email);
    },
    signOut: async (message) => {
      console.log("Sign out:", message.session?.user?.email);
    },
  },
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