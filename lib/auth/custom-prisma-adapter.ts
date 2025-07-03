// lib/auth/custom-prisma-adapter.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@/prisma/generated/client";
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
      try {
        // Get companyName from user object (this comes from JWT token)
        const companyName = (user as ExtendedAdapterUser).companyName;

        let organization;

        if (companyName && companyName.trim() !== "") {
          try {
            // Find or create organization based on companyName
            organization = await findOrCreateOrganization(prisma, companyName);
          } catch (orgError) {
            organization = null; // Will trigger fallback below
          }
        }

        // Fallback to Demo Company if no companyName or organization creation failed
        if (!organization) {
          organization = await prisma.organization.findFirst({
            where: { name: "Demo Company" }
          });

          if (!organization) {
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
          }
        }

        // Create user with required fields and assign to organization
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

        return {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          emailVerified: null,
          image: null,
        };
      } catch (error) {
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
        throw error;
      }
    },
  };
}