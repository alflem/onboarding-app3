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
    companyName?: string | null;
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
      companyName?: string;
      organization: {
        id: string;
        name: string;
      };
    };
  }

  /**
   * Utöka Profile-interfacet för att hantera Azure AD-roller och företagsinformation
   */
  interface Profile {
    roles?: string[];
    companyName?: string;
    company_name?: string;
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
    companyName?: string;
  }
}

// Extend AdapterAccount for Azure AD-specific fields (alternative)
declare module "next-auth/adapters" {
  interface AdapterAccount {
    ext_expires_in?: number;
  }
}