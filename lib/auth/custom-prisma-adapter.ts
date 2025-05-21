// lib/auth/custom-prisma-adapter.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { Adapter, AdapterUser, AdapterAccount } from "next-auth/adapters";

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  const standardAdapter = PrismaAdapter(prisma);

  return {
    ...standardAdapter,

    // Anpassa createUser för att hantera obligatoriska fält i ditt schema
    createUser: async (user: Omit<AdapterUser, "id">): Promise<AdapterUser> => {
      try {
        // Skapa användare med obligatoriska fält för din modell
        const newUser = await prisma.user.create({
          data: {
            name: user.name || user.email?.split('@')[0] || "Namnlös användare",
            email: user.email,
            // Obligatoriska fält i din User-modell
            password: "", // Tom sträng om det är obligatoriskt
            role: "EMPLOYEE", // Standard roll för nya användare
            // Om organizationId är obligatoriskt och du vill skapa en användare utan,
            // kan du antingen ändra schema eller hitta en "default" org
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
        console.error("Error creating user:", error);
        throw error;
      }
    },

    // Anpassa linkAccount-funktionen för att filtrera bort fält som saknas i ditt schema
    linkAccount: async (data: AdapterAccount): Promise<AdapterAccount> => {
      // Hämta endast de fält vi vet finns i ditt schema
      const {
        provider,
        type,
        providerAccountId,
        userId,
        token_type,
        scope,
        session_state,
      } = data;

      // Skapa en JSON-sträng av alla token-data för att spara i refresh_token
      const tokenData = {
        access_token: data.access_token,
        id_token: data.id_token,
        expires_at: data.expires_at,
        ext_expires_in: (data as any).ext_expires_in,
        // Lägg till eventuella andra fält från data som inte finns i ditt schema
      };

      // Spara endast de fält som finns i ditt schema
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
            // Lagra alla token-data som JSON i refresh_token
            refresh_token: JSON.stringify(tokenData),
          },
        });

        // Vi returnerar ett objekt som matchar AdapterAccount-typen
        return {
          provider: account.provider,
          type: account.type,
          providerAccountId: account.providerAccountId,
          userId: account.userId,
          token_type: account.token_type,
          scope: account.scope,
          session_state: account.session_state,
          refresh_token: account.refresh_token,
          // Återskapa originaldata från vår JSON-sträng
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