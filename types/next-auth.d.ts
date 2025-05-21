// types/next-auth.d.ts
import "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  /**
   * Utöka User-interfacet med våra egna fält
   */
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: Role;
    organizationId?: string | null;
    organizationName?: string | null;
  }

  /**
   * Utöka Session-interfacet med våra egna fält
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: Role;
      organizationId?: string;
      organizationName?: string;
      organization?: {
        id: string;
        name: string;
      };
    };
  }

  /**
   * Utöka Profile-interfacet för att hantera Azure AD-roller
   */
  interface Profile {
    roles?: string[];
  }
}

declare module "next-auth/jwt" {
  /**
   * Utöka JWT-interfacet med våra egna fält
   */
  interface JWT {
    id: string;
    role?: Role;
    organizationId?: string;
    organizationName?: string;
  }
}

// Utöka AdapterAccount för Azure AD-specifika fält (alternativt)
declare module "next-auth/adapters" {
  interface AdapterAccount {
    ext_expires_in?: number;
  }
}