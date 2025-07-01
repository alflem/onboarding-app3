// scripts/auto-seed-roles.js
// Auto-seed pre-assigned roles if none exist
const { PrismaClient } = require('../prisma/generated/client');

const prisma = new PrismaClient();

// Define the email addresses and their roles
const PRE_ASSIGNED_ROLES = [
  { email: "albin.flemstrom@xlent.se", role: "SUPER_ADMIN" },
  { email: "admin@xlent.se", role: "SUPER_ADMIN" },
  { email: "manager@xlent.se", role: "ADMIN" },
  // Add more email addresses as needed - just add them to this array
  // { email: "another-admin@xlent.se", role: "ADMIN" },
];

async function autoSeedRoles() {
  try {
    console.log("🔍 Checking if pre-assigned roles need seeding...");

    // Check if any pre-assigned roles already exist
    const existingRoles = await prisma.preAssignedRole.count();

    if (existingRoles > 0) {
      console.log(`✅ Found ${existingRoles} existing pre-assigned roles, skipping auto-seed`);
      return;
    }

    console.log("🌱 No pre-assigned roles found, auto-seeding...");

    let seededCount = 0;
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

        // Create pre-assigned role
        await prisma.preAssignedRole.create({
          data: {
            email: normalizedEmail,
            role: role
          }
        });

        console.log(`✅ Pre-assigned ${role} role to ${email}`);
        seededCount++;
      } catch (error) {
        console.error(`❌ Error assigning role to ${email}:`, error);
      }
    }

    if (seededCount > 0) {
      console.log(`🎉 Auto-seeded ${seededCount} pre-assigned roles!`);
    } else {
      console.log("ℹ️  No new roles were seeded (users may already exist)");
    }

  } catch (error) {
    console.error("❌ Auto-seeding failed:", error);
    // Don't fail the deployment if seeding fails
    process.exit(0);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the auto-seeding
autoSeedRoles();