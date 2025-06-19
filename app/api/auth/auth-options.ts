// auth/options.ts
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { CustomPrismaAdapter } from "@/lib/auth/custom-prisma-adapter";
import { updateUserOrganizationIfNeeded } from "@/lib/auth/organization-seeder";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// Function to map Azure AD roles to application roles
function mapAzureRoleToAppRole(azureRoles: string[] | undefined): Role {
  if (!azureRoles || azureRoles.length === 0) {
    return Role.EMPLOYEE; // Default role when no Azure roles assigned
  }

  // Check for super admin role first (highest priority)
  if (azureRoles.some(role => role.toLowerCase().includes('super_admin') || role.toLowerCase().includes('superadmin'))) {
    return Role.SUPER_ADMIN;
  }

  // Check for admin role
  if (azureRoles.some(role => role.toLowerCase().includes('admin'))) {
    return Role.ADMIN;
  }

  // Default to employee if roles exist but don't match known patterns
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

                // Extract roles from Azure AD token
        const azureRoles = azureProfile.roles || [];
        const mappedRole = mapAzureRoleToAppRole(azureRoles);

        console.log(`Azure AD profile callback - companyName: ${companyName}, roles: ${JSON.stringify(azureRoles)}, mappedRole: ${mappedRole} (from email: ${profile.email})`);

        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          companyName: companyName,
          role: mappedRole,
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
        token.role = user.role || Role.EMPLOYEE; // Set role from Azure AD mapping
      }

            // Try to get company name and roles from Azure AD profile
      if (account?.provider === "azure-ad" && profile) {
        const azureProfile = profile as AzureADProfile;

        // Try to extract roles from profile or id_token
        let roles: string[] = [];
        if (azureProfile.roles) {
          roles = azureProfile.roles;
        } else if (account.id_token) {
          try {
            // Decode the JWT token to get roles
            const base64Url = account.id_token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
                        const tokenPayload = JSON.parse(jsonPayload);

            if (tokenPayload.roles) {
              roles = tokenPayload.roles;
            }
          } catch (error) {
            console.error("Error decoding JWT token:", error);
          }
        }

        if (roles.length > 0) {
          const mappedRole = mapAzureRoleToAppRole(roles);
          console.log(`JWT callback - Found roles: ${JSON.stringify(roles)}, mapped to: ${mappedRole}`);
          token.role = mappedRole;
        }

        if (azureProfile.companyName || azureProfile.company_name) {
          token.companyName = azureProfile.companyName || azureProfile.company_name;
        } else if (account.access_token) {
          try {
            // Try to get company name and app role assignments from Microsoft Graph API
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

            // Try to get app role assignments if we don't have roles yet
            if (roles.length === 0) {
              try {
                const appRoleResponse = await fetch('https://graph.microsoft.com/v1.0/me/appRoleAssignments', {
                  headers: {
                    'Authorization': `Bearer ${account.access_token}`,
                    'Content-Type': 'application/json',
                  },
                });

                                if (appRoleResponse.ok) {
                  const appRoleData = await appRoleResponse.json();

                  // Extract role values from app role assignments
                  if (appRoleData.value && appRoleData.value.length > 0) {
                    // Note: You'll need to map these role IDs to actual role names
                    // This is a basic implementation - you might need to enhance this
                    const roleIds = appRoleData.value.map((assignment: any) => assignment.appRoleId);
                    console.log(`Found app role IDs:`, roleIds);
                  }
                }
              } catch (error) {
                console.error("Error fetching app role assignments:", error);
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
              // Update role in database if it's different from Azure AD role
              if (token.role && dbUser.role !== token.role) {
                console.log(`JWT callback - Updating user ${dbUser.email} role from ${dbUser.role} to ${token.role}`);
                await prisma.user.update({
                  where: { id: token.id },
                  data: { role: token.role }
                });
                dbUser.role = token.role; // Update local reference
              }

              token.role = dbUser.role;
              token.organizationId = dbUser.organizationId ?? undefined;
              token.organizationName = (dbUser.organization?.name as string | undefined);
              token.organization = dbUser.organization ? { id: dbUser.organization.id, name: dbUser.organization.name } : undefined;

              if (needsOrgCheck) {
                console.log(`JWT callback - User ${dbUser.email} assigned to organization: ${dbUser.organization?.name} (${dbUser.organizationId}) with role: ${dbUser.role}`);
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