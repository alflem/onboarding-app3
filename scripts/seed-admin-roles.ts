// scripts/seed-admin-roles.ts
// Run with: npx ts-node scripts/seed-admin-roles.ts
import { prisma } from '../lib/prisma';

// Define the email addresses and their roles
const PRE_ASSIGNED_ROLES = [
  { email: "albin.flemstrom@xlent.se", role: "SUPER_ADMIN" as const },
  { email: "emmy.valfridsson@xlent.se", role: "SUPER_ADMIN" as const },
  { email: "christian.werme@xlent.se", role: "SUPER_ADMIN" as const },
  { email: "anders.falkeholm@xlent.se", role: "SUPER_ADMIN" as const },


  // Add more email addresses as needed - just add them to this array
  // { email: "another-admin@xlent.se", role: "ADMIN" as const },
];

async function seedPreAssignedRoles() {
  console.log("🌱 Seeding pre-assigned roles...");

  for (const { email, role } of PRE_ASSIGNED_ROLES) {
    try {
      const normalizedEmail = email.toLowerCase();

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        console.log(`⚠️  User ${email} already exists, skipping pre-assignment`);
        continue;
      }

      // Upsert pre-assigned role
      await prisma.preAssignedRole.upsert({
        where: { email: normalizedEmail },
        create: {
          email: normalizedEmail,
          role: role
        },
        update: {
          role: role
        }
      });

      console.log(`✅ Pre-assigned ${role} role to ${email}`);
    } catch (error) {
      console.error(`❌ Error assigning role to ${email}:`, error);
    }
  }

  console.log("🎉 Pre-assigned roles seeding completed!");
}

// Run the seeding
seedPreAssignedRoles()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });