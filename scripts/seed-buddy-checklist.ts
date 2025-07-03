import { prisma } from '../lib/prisma';
import {
  createOrganizationWithFullChecklist,
  addBuddyChecklistToOrganizationByName,
  findOrCreateOrganization
} from '../lib/auth/organization-seeder';

async function demonstrateBuddyChecklistSeeding() {
  try {
    console.log('=== Buddy Checklist Seeding Demo ===\n');

    // Exempel 1: Skapa ny organisation med fullständig checklista (inkl. buddy-uppgifter)
    console.log('1. Skapar ny organisation med fullständig checklista...');
    const newOrg = await createOrganizationWithFullChecklist(prisma, 'Demo Organisation AB');
    console.log(`✅ Skapad organisation: ${newOrg.name} (ID: ${newOrg.id})\n`);

    // Exempel 2: Lägg till buddy-checklista till en befintlig organisation
    console.log('2. Lägger till buddy-checklista till befintlig organisation...');
    try {
      await addBuddyChecklistToOrganizationByName(prisma, 'Befintlig Organisation AB');
      console.log('✅ Buddy-checklista tillagd till befintlig organisation\n');
    } catch (error) {
      console.log('ℹ️  Organisationen finns inte, vilket är förväntat för detta demo\n');
    }

    // Exempel 3: Använd findOrCreateOrganization (som nu automatiskt inkluderar buddy-uppgifter)
    console.log('3. Använder findOrCreateOrganization (inkluderar nu buddy-uppgifter automatiskt)...');
    const foundOrCreatedOrg = await findOrCreateOrganization(prisma, 'Auto-skapad Organisation AB');
    console.log(`✅ Organisation: ${foundOrCreatedOrg.name} (ID: ${foundOrCreatedOrg.id})\n`);

    // Visa vad som skapats
    console.log('4. Visar vilka kategorier som skapats...');
    const orgWithChecklist = await prisma.organization.findFirst({
      where: { name: 'Demo Organisation AB' },
      include: {
        checklist: {
          include: {
            categories: {
              include: {
                tasks: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });

    if (orgWithChecklist?.checklist) {
      console.log(`Organisation: ${orgWithChecklist.name}`);
      console.log(`Antal kategorier: ${orgWithChecklist.checklist.categories.length}`);

      orgWithChecklist.checklist.categories.forEach((category, index) => {
        const buddyTasks = category.tasks.filter(task => task.isBuddyTask);
        const regularTasks = category.tasks.filter(task => !task.isBuddyTask);

        console.log(`  ${index + 1}. ${category.name}`);
        console.log(`     - Vanliga uppgifter: ${regularTasks.length}`);
        console.log(`     - Buddy-uppgifter: ${buddyTasks.length}`);
        console.log(`     - Totalt: ${category.tasks.length} uppgifter`);
      });
    }

    console.log('\n=== Demo slutförd ===');

  } catch (error) {
    console.error('❌ Fel under demo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Endast kör demo om filen körs direkt
if (require.main === module) {
  demonstrateBuddyChecklistSeeding();
}

export { demonstrateBuddyChecklistSeeding };