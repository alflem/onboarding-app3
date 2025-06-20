import { PrismaClient } from '@prisma/client';

export const DEFAULT_CHECKLIST_CATEGORIES = [
  {
    name: 'Din digitala setup',
    order: 1,
    tasks: [
      {
        title: 'IT-utrustning',
        description: 'Har du all IT-utrustning du behöver? Fungerar allt? Om inte – kontakta IT-ansvarig på kontoret!',
        order: 1,
        isBuddyTask: false
      },
    ]
  },
  {
    name: 'Information',
    order: 2,
    tasks: [
      {
        title: 'Hållbara konsulter',
        description: 'Att trivas och må bra på jobbet ser vi som en självklarhet, därför har vi skapat Hållbara konsulter. Läs mer om XLENTs viktiga och pågående arbete inom social hållbarhet.',
        order: 1,
        isBuddyTask: false,
        link: 'https://example.com/hallbara-konsulter'
      },
      {
        title: 'Intranätets startsida',
        description: 'På intranätets startsida finns mycket att läsa! Allt från information om våra processer till manualer om hur du tidrapporterar. Här hittar du också genvägar till våra viktigaste arbetsverktyg. Glöm inte att klicka dig in på Workplace - XLENTs sida för nyheter, kultur och samverkan!',
        order: 2,
        isBuddyTask: false,
        link: 'https://example.com/intranet-startsida'
      },
      {
        title: 'Medarbetarresan',
        description: 'Här får du en samlad bild över våra delprocesser för dig som anställd.',
        order: 3,
        isBuddyTask: false,
        link: 'https://example.com/medarbetarresan'
      },
      {
        title: 'Teams',
        description: 'Teams är vår främsta kommunikationskanal samt samlingsyta för vårt interna arbete. Kika gärna runt för att bekanta dig med såväl innehåll som struktur.',
        order: 4,
        isBuddyTask: false,
        link: 'https://example.com/teams'
      },
      {
        title: 'Maconomy',
        description: 'Vi använder Maconomy, som nås via intranätets startsida, för tidrapportering, attestering, reseräkningar med mera. Någon av dina nya kollegor kommer gå igenom Maconomy med dig.',
        order: 5,
        isBuddyTask: false
      },
      {
        title: 'CSF Support och service',
        description: 'XLENTs centrala support kallas CSF. Kontakta dem vid behov av support.',
        order: 6,
        isBuddyTask: false,
        link: 'https://example.com/csf-support'
      },
      {
        title: 'Varumärkessidan',
        description: 'XLENT-koncernen består av många olika bolag och varumärken. På den här sidan hittar du info om varumärke, logotyper, mallar etc.',
        order: 7,
        isBuddyTask: false,
        link: 'https://example.com/varumarkessidan'
      },
    ]
  },
  {
    name: 'Praktiskt att fixa',
    order: 3,
    tasks: [
      {
        title: 'Foto på hemsidan',
        description: 'Vi skulle gärna vilja ta ett foto på dig! Fotot skickas sedan till XLENTs varumärkesansvarig som lägger upp det på vår hemsida. Någon av dina nya kollegor hjälper dig med foto samt säkerställer att det skickas till rätt person.',
        order: 1,
        isBuddyTask: false,
        link: 'https://example.com/foto-hemsidan'
      },
      {
        title: 'Foto till digitala plattformar',
        description: 'Ladda upp foto: • I Office365 • På Workplace • I Cinode • I utpekad mapp i Teams',
        order: 2,
        isBuddyTask: false
      },
      {
        title: 'Foto till kontoret',
        description: 'Vi sätter upp foton på våra anställda på kontoret. Skriv ut ditt foto, sätt i ram och ställ/häng det på kontoret.',
        order: 3,
        isBuddyTask: false
      },
      {
        title: 'Presentation Instagram',
        description: 'Vi vill presentera dig på vår Instagram! Prata med den som är ansvarig för våra sociala medier så guidar hen dig vidare.',
        order: 4,
        isBuddyTask: false,
        link: 'https://example.com/presentation-instagram'
      },
      {
        title: 'Workplace',
        description: 'På Workplace, under Redigera profil, fyll i namnet på din chef. När du gjort det får du åtkomst till flertalet grupper. Självklart kan du välja att gå med i ytterligare grupper. Rekommenderade grupper: • XLENT syns och hörs • Försäljning inom XLENT • Kompetensluncher • CSF informerar • Har du hört • Fråga XLENT',
        order: 5,
        isBuddyTask: false
      },
      {
        title: 'Uppdatera personlig information i HR-system',
        description: 'Se över ICE-kontakten och ev. kontonummer i HR-systemet Sympa. Du fyller i informationen under My profile > Manage personal info. Sympa nås via intranätets startsida.',
        order: 6,
        isBuddyTask: false
      },
      {
        title: 'Skapa en e-mailsignatur',
        description: 'Skapa en e-mailsignatur.',
        order: 7,
        isBuddyTask: false,
        link: 'https://example.com/email-signatur'
      },
      {
        title: 'Kontaktuppgifter',
        description: 'Säkerställ att ditt telefonnummer och kostavvikelser dokumenteras på avsedd yta. Någon av dina nya kollegor guidar dig rätt!',
        order: 8,
        isBuddyTask: false
      },
      {
        title: 'Sjukvårdsförsäkring (frivillig)',
        description: 'Anmäl sjukvårdsförsäkring till Söderberg & Partners (om aktuellt)',
        order: 9,
        isBuddyTask: false,
        link: 'https://example.com/sjukvardsforsakring'
      },
    ]
  },
];

/**
 * Skapar en ny organisation och seedar den med standardchecklistan
 */
export async function createOrganizationWithChecklist(
  prisma: PrismaClient,
  organizationName: string
) {
  console.log(`Creating organization: ${organizationName}`);

  // Skapa organisationen
  const organization = await prisma.organization.create({
    data: {
      name: organizationName,
      buddyEnabled: true,
    },
  });

  console.log(`Organization created with ID: ${organization.id}`);

  // Skapa checklista för organisationen
  const checklist = await prisma.checklist.create({
    data: {
      organizationId: organization.id,
    },
  });

  console.log(`Checklist created with ID: ${checklist.id}`);

  // Skapa kategorier och tasks
  for (const categoryData of DEFAULT_CHECKLIST_CATEGORIES) {
    const { name, order, tasks } = categoryData;

    const category = await prisma.category.create({
      data: {
        name,
        order,
        checklistId: checklist.id,
      },
    });

    console.log(`Category "${name}" created with ID: ${category.id}`);

    // Skapa tasks för denna kategori
    for (const taskData of tasks) {
      await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          order: taskData.order,
          isBuddyTask: taskData.isBuddyTask,
          categoryId: category.id,
          ...(taskData.link && { link: taskData.link })
        },
      });
    }
  }

  console.log(`Organization "${organizationName}" has been fully seeded with checklist`);
  return organization;
}

/**
 * Hittar eller skapar en organisation baserat på companyName
 */
export async function findOrCreateOrganization(
  prisma: PrismaClient,
  companyName: string
) {
  // Leta efter befintlig organisation
  const organization = await prisma.organization.findFirst({
    where: {
      name: companyName
    }
  });

  if (organization) {
    console.log(`Found existing organization: ${companyName} (ID: ${organization.id})`);
    return organization;
  }

  // Skapa ny organisation med checklista
  console.log(`Organization "${companyName}" not found, creating new one...`);
  return await createOrganizationWithChecklist(prisma, companyName);
}

/**
 * Kontrollerar om en användare behöver flyttas till en annan organisation
 * och uppdaterar i så fall användarens organisation
 */
export async function updateUserOrganizationIfNeeded(
  prisma: PrismaClient,
  userId: string,
  newCompanyName: string
) {
  try {
    // Hämta användaren med nuvarande organisation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!user) {
      console.log(`User with ID ${userId} not found`);
      return null;
    }

    // Om användaren inte har någon organisation, tilldela till rätt organisation
    if (!user.organization) {
      console.log(`User ${user.email} has no organization, assigning to: ${newCompanyName}`);
      const targetOrganization = await findOrCreateOrganization(prisma, newCompanyName);

      await prisma.user.update({
        where: { id: userId },
        data: { organizationId: targetOrganization.id }
      });

      console.log(`User ${user.email} assigned to organization: ${newCompanyName} (${targetOrganization.id})`);
      return targetOrganization;
    }

    // Om användaren redan har samma organisation, gör ingenting
    if (user.organization.name === newCompanyName) {
      // Logga bara vid behov, inte varje gång
      return user.organization;
    }

    // Användaren behöver flyttas till en annan organisation (ovanligt scenario)
    console.log(`User ${user.email} needs to be moved from "${user.organization.name}" to "${newCompanyName}"`);

    // Hitta eller skapa målorganisationen
    const targetOrganization = await findOrCreateOrganization(prisma, newCompanyName);

    // Uppdatera användarens organisation
    await prisma.user.update({
      where: { id: userId },
      data: { organizationId: targetOrganization.id }
    });

    console.log(`User ${user.email} successfully moved to organization: ${newCompanyName} (${targetOrganization.id})`);
    return targetOrganization;

  } catch (error) {
    console.error("Error updating user organization:", error);
    throw error;
  }
}