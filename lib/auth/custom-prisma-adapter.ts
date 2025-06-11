// lib/auth/custom-prisma-adapter.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { Adapter, AdapterUser, AdapterAccount } from "next-auth/adapters";

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  const standardAdapter = PrismaAdapter(prisma);

  return {
    ...standardAdapter,

    // Customize createUser to handle required fields in your schema
    createUser: async (user: Omit<AdapterUser, "id">): Promise<AdapterUser> => {
      console.log("CustomPrismaAdapter.createUser called for:", user.email);
      try {
        // Find or create "Demo Company" organization
        console.log("Looking for Demo Company organization...");
        let demoOrganization = await prisma.organization.findFirst({
          where: {
            name: "Demo Company"
          }
        });

        if (!demoOrganization) {
          console.log("Creating Demo Company organization...");
          demoOrganization = await prisma.organization.create({
            data: {
              name: "Demo Company",
              buddyEnabled: true,
            }
          });
          console.log("Demo Company created with ID:", demoOrganization.id);
        } else {
          console.log("Demo Company found with ID:", demoOrganization.id);
        }

        // Create user with required fields and assign to Demo Company
        console.log("Creating user with Demo Company assignment...");
        const newUser = await prisma.user.create({
          data: {
            name: user.name || user.email?.split('@')[0] || "Unnamed User",
            email: user.email,
            // Required fields in your User model
            password: "", // Empty string if required
            role: "ADMIN", // Set new users as ADMIN by default
            organizationId: demoOrganization.id, // Assign to Demo Company
          },
        });

        console.log(`New user ${newUser.email} created and assigned to Demo Company (${demoOrganization.id})`);

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