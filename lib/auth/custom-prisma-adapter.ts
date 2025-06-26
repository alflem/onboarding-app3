// lib/auth/custom-prisma-adapter.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient, Role } from "@prisma/client";
import { Adapter, AdapterUser, AdapterAccount } from "next-auth/adapters";
import { findOrCreateOrganization } from "./organization-seeder";

// Extend AdapterUser to include companyName and Azure management info
interface ExtendedAdapterUser extends AdapterUser {
  companyName?: string;
  isAzureManaged?: boolean;
}

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  const standardAdapter = PrismaAdapter(prisma);

  return {
    ...standardAdapter,

    // Customize createUser to handle required fields in your schema
    createUser: async (user: Omit<AdapterUser, "id">): Promise<AdapterUser> => {
      console.log("CustomPrismaAdapter.createUser called for:", user.email);
      try {
        // Get companyName and Azure management info from user object (this comes from JWT token)
        const extendedUser = user as ExtendedAdapterUser;
        const companyName = extendedUser.companyName;
        const userRole = Role.EMPLOYEE; // Default role for new users, will be updated in JWT callback
        const isAzureManaged = extendedUser.isAzureManaged || false;
        console.log(`CompanyName in createUser: ${companyName}, role: ${userRole}, isAzureManaged: ${isAzureManaged}`);

        let organization;

        // First try to find Demo Company
        organization = await prisma.organization.findFirst({
          where: { name: "Demo Company" }
        });

        // If Demo Company doesn't exist, create it simply
        if (!organization) {
          console.log("Creating simple Demo Company organization...");
          try {
            organization = await prisma.organization.create({
              data: {
                name: "Demo Company",
                buddyEnabled: true,
              },
            });
            console.log(`Created Demo Company organization with ID: ${organization.id}`);
          } catch (createError) {
            console.error("Error creating Demo Company:", createError);
            // If we can't even create Demo Company, there's a serious database issue
            throw new Error("Failed to create organization for user");
          }
        }

        // Create user with required fields and assign to organization
        console.log(`Creating user with organization assignment: ${organization.name} (${organization.id})`);

        try {
          const newUser = await prisma.user.create({
            data: {
              name: user.name || user.email?.split('@')[0] || "Unnamed User",
              email: user.email!,
              // Required fields in your User model
              password: "", // Empty string if required
              role: userRole, // Use role from Azure AD or default to EMPLOYEE
              isAzureManaged: isAzureManaged, // Track if user is managed by Azure AD
              organizationId: organization.id, // Assign to correct organization
            },
          });

          console.log(`New user ${newUser.email} created and assigned to ${organization.name} (${organization.id})`);

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            emailVerified: null,
            image: null,
          };
        } catch (userCreateError) {
          console.error("Error creating user in database:", userCreateError);
          console.error("User data:", {
            name: user.name,
            email: user.email,
            organizationId: organization.id
          });
          throw new Error(`Failed to create user: ${userCreateError}`);
        }
      } catch (error) {
        console.error("Error in createUser adapter:", error);
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