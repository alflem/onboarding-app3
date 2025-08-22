// auth/options.ts
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { CustomPrismaAdapter } from "@/lib/auth/custom-prisma-adapter";
import { updateUserOrganizationIfNeeded } from "@/lib/auth/organization-seeder";
import { prisma, type Role, PrismaClient } from "@/lib/prisma";

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

                    // Check if user should be connected to a buddy preparation
      if (needsOrgCheck && dbUser.email && dbUser.organizationId) {
        try {
          await connectUserToBuddyPreparation(prisma, dbUser.id, dbUser.email, dbUser.organizationId);
        } catch (buddyError) {
          console.error("Error connecting user to buddy preparation (continuing with login):", buddyError);
          // Don't stop the login process if buddy connection fails
        }
      }

      // Also check if there are any completed buddy preparations that should be cleaned up
      if (needsOrgCheck && dbUser.email && dbUser.organizationId) {
        try {
          await cleanupCompletedBuddyPreparations(prisma, dbUser.email, dbUser.organizationId);
        } catch (cleanupError) {
          console.error("Error cleaning up completed buddy preparations (continuing with login):", cleanupError);
          // Don't stop the login process if cleanup fails
        }
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

/**
 * Connects a user to a buddy preparation if there's an active preparation with their email
 */
async function connectUserToBuddyPreparation(
  prisma: PrismaClient,
  userId: string,
  userEmail: string,
  organizationId: string
) {
  try {
    // Look for an active buddy preparation with the user's email in their organization
    const buddyPreparation = await prisma.buddyPreparation.findFirst({
      where: {
        email: userEmail.toLowerCase().trim(),
        organizationId: organizationId,
        isActive: true,
        userId: null, // Not already connected to a user
      },
    });

    if (buddyPreparation) {
      console.log(`Found buddy preparation for user ${userEmail}, connecting...`);

      // Migrate task progress from BuddyPreparationTaskProgress to TaskProgress FIRST
      const migratedTasks = await migrateTaskProgress(prisma, buddyPreparation.id, userId);
      console.log(`Migration completed: ${migratedTasks} tasks migrated`);

      // Clear any existing buddy assignments for this user
      await prisma.buddyAssignment.deleteMany({
        where: { userId: userId }
      });

      // Create new buddy assignment
      await prisma.buddyAssignment.create({
        data: {
          userId: userId,
          buddyId: buddyPreparation.buddyId,
        },
      });

      // Set the user's buddy to the preparation's buddy (legacy compatibility)
      await prisma.user.update({
        where: { id: userId },
        data: {
          buddyId: buddyPreparation.buddyId,
        },
      });

      // Only AFTER successful migration, connect the user to the buddy preparation
      await prisma.buddyPreparation.update({
        where: { id: buddyPreparation.id },
        data: {
          userId: userId,
          isActive: false, // Mark as connected
        },
      });

      console.log(`User ${userEmail} successfully connected to buddy preparation and assigned buddy ${buddyPreparation.buddyId}`);
    } else {
      console.log(`No active buddy preparation found for user ${userEmail}`);
    }
  } catch (error) {
    console.error("Error connecting user to buddy preparation:", error);
    throw error;
  }
}

/**
 * Cleans up completed buddy preparations that are no longer needed
 */
async function cleanupCompletedBuddyPreparations(
  prisma: PrismaClient,
  userEmail: string,
  organizationId: string
) {
  try {
    // Find all buddy preparations for this email that are completed (have userId) but still marked as active
    const completedPreparations = await prisma.buddyPreparation.findMany({
      where: {
        email: userEmail.toLowerCase().trim(),
        organizationId: organizationId,
        userId: { not: null }, // Has been connected to a user
        isActive: true, // But still marked as active
      },
    });

    if (completedPreparations.length > 0) {
      console.log(`Found ${completedPreparations.length} completed buddy preparations for ${userEmail}, cleaning up...`);

      // Mark all as inactive since they're completed
      await prisma.buddyPreparation.updateMany({
        where: {
          id: { in: completedPreparations.map(p => p.id) }
        },
        data: {
          isActive: false,
        },
      });

      console.log(`Successfully cleaned up ${completedPreparations.length} completed buddy preparations for ${userEmail}`);
    }
  } catch (error) {
    console.error("Error cleaning up completed buddy preparations:", error);
    throw error;
  }
}

/**
 * Migrates task progress from BuddyPreparationTaskProgress to TaskProgress
 * when a user is connected to a buddy preparation
 * Returns the number of tasks migrated
 */
async function migrateTaskProgress(
  prisma: PrismaClient,
  preparationId: string,
  userId: string
): Promise<number> {
  try {
    console.log(`Migrating task progress from preparation ${preparationId} to user ${userId}...`);

    // Get all task progress from the buddy preparation
    const preparationProgress = await prisma.buddyPreparationTaskProgress.findMany({
      where: { preparationId: preparationId },
      include: { task: true }
    });

    if (preparationProgress.length > 0) {
      console.log(`Found ${preparationProgress.length} tasks to migrate...`);

      // Migrate each task progress
      for (const progress of preparationProgress) {
        // Check if task progress already exists for this user and task
        const existingProgress = await prisma.taskProgress.findUnique({
          where: {
            userId_taskId: {
              userId: userId,
              taskId: progress.taskId
            }
          }
        });

        if (!existingProgress) {
          // Create new task progress for the user
          await prisma.taskProgress.create({
            data: {
              userId: userId,
              taskId: progress.taskId,
              completed: progress.completed,
              createdAt: progress.createdAt,
              updatedAt: progress.updatedAt
            }
          });
        } else {
          // Update existing progress if preparation progress is more recent
          if (progress.updatedAt > existingProgress.updatedAt) {
            await prisma.taskProgress.update({
              where: { id: existingProgress.id },
              data: {
                completed: progress.completed,
                updatedAt: progress.updatedAt
              }
            });
          }
        }
      }

      console.log(`Successfully migrated ${preparationProgress.length} task progress items`);
      return preparationProgress.length;
    } else {
      console.log(`No task progress to migrate for preparation ${preparationId}`);
      return 0;
    }
  } catch (error) {
    console.error("Error migrating task progress:", error);
    throw error;
  }
}