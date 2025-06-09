// auth/options.ts
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { CustomPrismaAdapter } from "@/lib/auth/custom-prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
          scope: "openid profile email"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile: _profile }) {
      // Om en användare loggar in via Azure AD
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;

        // Om det är första inloggningen via OAuth
        if (account?.provider === "azure-ad") {
          // Hämta användarens roll och organisation från databasen
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              include: {
                organization: true
              }
            });

            if (dbUser?.role) {
              // Använd rollen från databasen
              token.role = dbUser.role;
            } else {
              // Fallback till EMPLOYEE om rollen inte finns i databasen
              token.role = "EMPLOYEE";
            }

            // Lägg till organisation-info
            if (dbUser?.organization) {
              token.organizationId = dbUser.organization.id;
              token.organizationName = dbUser.organization.name;
            }
          } catch (error) {
            console.error("Fel vid hämtning av användarroll:", error);
            // Fallback till EMPLOYEE vid fel
            token.role = "EMPLOYEE";
          }
        }

        // Lägg till organization-info om det finns (för befintliga tokens)
        if ('organizationId' in user && user.organizationId) {
          token.organizationId = user.organizationId;
          token.organizationName = (user as { organizationName?: string }).organizationName;
        }
      }

      return token;
    },
    async session({ session, token }) {
      console.log('Session callback called for user:', session.user?.email);

      if (session.user) {
        session.user.id = token.id as string;

        if (token.role) {
          session.user.role = token.role as "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
        }

        console.log('Checking organization for user:', session.user.id);
        console.log('Token organizationId:', token.organizationId);
        console.log('Token organizationName:', token.organizationName);

        // Ensure organization is always set
        if (token.organizationId && token.organizationName) {
          session.user.organizationId = token.organizationId as string;
          session.user.organizationName = token.organizationName as string;
          session.user.organization = {
            id: token.organizationId as string,
            name: token.organizationName as string
          };
          console.log('Organization set from token:', token.organizationName);
        } else {
          // If no organization is found in token, try to fetch from database
          console.log('No organization in token, fetching from database...');
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: session.user.id },
              include: {
                organization: true
              }
            });

            console.log('Database user found:', !!dbUser);
            console.log('Database user organization:', dbUser?.organization?.name);

            if (dbUser?.organization) {
              session.user.organizationId = dbUser.organization.id;
              session.user.organizationName = dbUser.organization.name;
              session.user.organization = {
                id: dbUser.organization.id,
                name: dbUser.organization.name
              };
              console.log('Organization set from database:', dbUser.organization.name);
            } else {
              // Fallback: Create Demo Company and assign user if they don't have an organization
              console.log('Creating Demo Company fallback...');
              let demoOrganization = await prisma.organization.findFirst({
                where: { name: "Demo Company" }
              });

              if (!demoOrganization) {
                console.log('Demo Company not found, creating...');
                demoOrganization = await prisma.organization.create({
                  data: {
                    name: "Demo Company",
                    buddyEnabled: true,
                  }
                });
                console.log('Demo Company created:', demoOrganization.id);
              } else {
                console.log('Demo Company found:', demoOrganization.id);
              }

              // Assign user to Demo Company
              console.log('Assigning user to Demo Company...');
              await prisma.user.update({
                where: { id: session.user.id },
                data: { organizationId: demoOrganization.id }
              });

              session.user.organizationId = demoOrganization.id;
              session.user.organizationName = demoOrganization.name;
              session.user.organization = {
                id: demoOrganization.id,
                name: demoOrganization.name
              };
              console.log('User assigned to Demo Company successfully');
            }
          } catch (error) {
            console.error("Error fetching user organization:", error);
            throw new Error("User must have an organization");
          }
        }
      }
      console.log('Session callback completed successfully');
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.AUTH_SECRET,
};