// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";

// Utöka User-objektet i session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      organization: {
        id: string;
        name: string;
      };
      // För bakåtkompatibilitet med din befintliga kod
      organizationId: string;
      organizationName: string;
    } & DefaultSession["user"];
  }

  // Utöka User-objektet för autentisering
  interface User extends DefaultUser {
    id: string;
    role: UserRole;
    organizationId: string;
    organizationName: string;
  }
}

// Utöka JWT-objektet
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    organizationId: string;
    organizationName: string;
  }
}