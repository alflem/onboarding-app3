import NextAuth from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";

// Skapa handlers med authOptions
const handler = NextAuth(authOptions);

// Exportera endast HTTP handlers
export { handler as GET, handler as POST };