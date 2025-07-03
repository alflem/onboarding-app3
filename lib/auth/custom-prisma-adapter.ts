// lib/auth/custom-prisma-adapter.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient, BuddyPreparation } from "@/prisma/generated/client";
import { Adapter, AdapterUser, AdapterAccount } from "next-auth/adapters";
import { findOrCreateOrganization } from "./organization-seeder";

// Extend AdapterUser to include companyName
interface ExtendedAdapterUser extends AdapterUser {
  companyName?: string;
}

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  const standardAdapter = PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]);

  return {
    ...standardAdapter,

    // Customize createUser to handle required fields in your schema
    createUser: async (user: Omit<AdapterUser, "id">): Promise<AdapterUser> => {
      console.log("CustomPrismaAdapter.createUser called for:", user.email);
      try {
        // Get companyName from user object (this comes from JWT token)
        const companyName = (user as ExtendedAdapterUser).companyName;
        console.log(`CompanyName in createUser: ${companyName}`);

        let organization;

        if (companyName && companyName.trim() !== "") {
          console.log(`Using companyName from JWT token: ${companyName}`);
          try {
            // Find or create organization based on companyName
            organization = await findOrCreateOrganization(prisma, companyName);
          } catch (orgError) {
            console.error(`Error with organization "${companyName}", falling back to Demo Company:`, orgError);
            organization = null; // Will trigger fallback below
          }
        }

        // Fallback to Demo Company if no companyName or organization creation failed
        if (!organization) {
          console.log("Using Demo Company as fallback");
          organization = await prisma.organization.findFirst({
            where: { name: "Demo Company" }
          });

          if (!organization) {
            console.log("Creating Demo Company organization...");
            organization = await findOrCreateOrganization(prisma, "Demo Company");
          }
        }

        // Check for pre-assigned role
        let assignedRole = "ADMIN"; // Default role
        if (user.email) {
          const preAssignedRole = await prisma.preAssignedRole.findUnique({
            where: { email: user.email.toLowerCase() }
          });
          if (preAssignedRole) {
            assignedRole = preAssignedRole.role;
            console.log(`Found pre-assigned role for ${user.email}: ${assignedRole}`);
          }
        }

        // Create user with required fields and assign to organization
        console.log(`Creating user with organization assignment: ${organization.name} (${organization.id}) - Role: ${assignedRole}`);
        const newUser = await prisma.user.create({
          data: {
            name: user.name || user.email?.split('@')[0] || "Unnamed User",
            email: user.email,
            // Required fields in your User model
            password: "", // Empty string if required
            role: assignedRole as "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE", // Use pre-assigned or default role
            organizationId: organization.id, // Assign to correct organization
          },
        });

        console.log(`New user ${newUser.email} created and assigned to ${organization.name} (${organization.id}) with role ${newUser.role}`);

        // Now perform buddy preparation matching and linking (after role is set)
        if (user.email) {
          try {
            console.log(`Checking for buddy preparation for email: ${user.email} in organization: ${organization.id}`);

            // First, let's check what buddy preparations exist for this organization
            const allPreparations = await prisma.buddyPreparation.findMany({
              where: {
                organizationId: organization.id,
                isActive: true,
              },
            });
            console.log(`Found ${allPreparations.length} active buddy preparations in organization ${organization.id}:`,
              allPreparations.map((p: BuddyPreparation) => ({ id: p.id, email: p.email, firstName: p.firstName, lastName: p.lastName }))
            );

            // Try multiple matching strategies
            const userEmailLower = user.email.toLowerCase().trim();
            let buddyPreparation = null;

            // Strategy 1: Exact match
            buddyPreparation = await prisma.buddyPreparation.findFirst({
              where: {
                email: userEmailLower,
                organizationId: organization.id,
                isActive: true,
              },
            });

            // Strategy 2: Case-insensitive match if exact match failed
            if (!buddyPreparation) {
              console.log(`No exact match found, trying case-insensitive search for: ${userEmailLower}`);
              const allActivePreparations = await prisma.buddyPreparation.findMany({
                where: {
                  organizationId: organization.id,
                  isActive: true,
                  email: { not: null },
                },
              });

              buddyPreparation = allActivePreparations.find((p: BuddyPreparation) =>
                p.email && p.email.toLowerCase().trim() === userEmailLower
              );
            }

            // Strategy 3: Check if email domain matches (fallback)
            if (!buddyPreparation) {
              console.log(`No email match found, checking domain match for: ${userEmailLower}`);
              const userDomain = userEmailLower.split('@')[1];
              if (userDomain) {
                const domainPreparations = await prisma.buddyPreparation.findMany({
                  where: {
                    organizationId: organization.id,
                    isActive: true,
                    email: { not: null },
                  },
                });

                buddyPreparation = domainPreparations.find((p: BuddyPreparation) =>
                  p.email && p.email.toLowerCase().includes(userDomain)
                );
              }
            }

            console.log(`Final buddy preparation search result for ${userEmailLower}:`, buddyPreparation);

            if (buddyPreparation) {
              console.log(`Found active buddy preparation for ${user.email}, linking to user and assigning buddy`);

              // Update user with buddy assignment
              await prisma.user.update({
                where: { id: newUser.id },
                data: {
                  buddyId: buddyPreparation.buddyId,
                },
              });

              // Update buddy preparation to mark as completed and link to user
              await prisma.buddyPreparation.update({
                where: { id: buddyPreparation.id },
                data: {
                  userId: newUser.id,
                  isActive: false,
                },
              });

              console.log(`Buddy preparation completed: ${newUser.email} assigned to buddy ${buddyPreparation.buddyId}`);
            } else {
              console.log(`No active buddy preparation found for ${user.email} in organization ${organization.id}`);
            }
          } catch (buddyPrepError) {
            console.error("Error processing buddy preparation:", buddyPrepError);
            // Don't fail user creation if buddy preparation fails
          }
        }

        return {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          emailVerified: null,
          image: null,
        };
      } catch (error) {
        console.error("Error creating user:", error);
        throw error;
      }
    },

    // Customize linkAccount function to filter out fields missing from your schema
    linkAccount: async (data: AdapterAccount): Promise<AdapterAccount> => {
      // Get only the fields we know exist in your schema
      const {
        provider,
        type,
        providerAccountId,
        userId,
        token_type,
        scope,
        session_state,
      } = data;

      // Create a JSON string of all token data to save in refresh_token
      const tokenData = {
        access_token: data.access_token,
        id_token: data.id_token,
        expires_at: data.expires_at,
        ext_expires_in: (data as { ext_expires_in?: number }).ext_expires_in,
        // Add any other fields from data that don't exist in your schema
      };

      // Save only the fields that exist in your schema
      try {
        const account = await prisma.account.create({
          data: {
            provider,
            type,
            providerAccountId,
            userId,
            token_type,
            scope,
            session_state,
            // Store all token data as JSON in refresh_token
            refresh_token: JSON.stringify(tokenData),
          },
        });

        // We return an object that matches the AdapterAccount type
        return {
          provider: account.provider,
          type: account.type,
          providerAccountId: account.providerAccountId,
          userId: account.userId,
          token_type: account.token_type,
          scope: account.scope,
          session_state: account.session_state,
          refresh_token: account.refresh_token,
          // Recreate original data from our JSON string
          ...(account.refresh_token ? JSON.parse(account.refresh_token) : {}),
          id: account.id,
        };
      } catch (error) {
        console.error("Error creating account:", error);
        throw error;
      }
    },
  };
}