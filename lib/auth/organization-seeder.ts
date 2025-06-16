import { PrismaClient } from '@prisma/client';

const DEFAULT_CHECKLIST_CATEGORIES = [
  {
    name: 'Din digitala setup',
    order: 1,
    tasks: [
      {
        title: 'Dator och mobil',
        description: 'Se till att installera och få igång din dator och telefon.',
        order: 1,
        isBuddyTask: true
      },
      {
        title: 'Har du all utrustning du behöver?',
        description: 'Har du all utrustning du behöver? Om inte – kontakta IT-ansvarig på kontoret.',
        order: 2,
        isBuddyTask: false
      },
    ]
  },
  {
    name: 'Ekonomi och affärssystem',
    order: 2,
    tasks: [
      {
        title: 'Medarbetarresan',
        description: 'Här får du en samlad bild över våra delprocesser för dig som anställd.',
        order: 1,
        isBuddyTask: false,
        link: 'https://example.com/medarbetarresan'
      },
      {
        title: 'Teams',
        description: 'Teams är ytan för vårt interna arbete. Här hittar du allt från fokusgrupper till bilder och semesterplanering.',
        order: 2,
        isBuddyTask: false,
        link: 'https://example.com/teams'
      },
      {
        title: 'Intranät',
        description: 'På vårt intranät hittar du det mesta. Hämför när du system för exempelvis tidrapportering och CV-skrivande. Här finns även Workplace - XLENTs yta för nyheter, kultur och samverkan. Ta dig tid att klicka runt!',
        order: 3,
        isBuddyTask: false,
        link: 'https://example.com/intranet'
      },
      {
        title: 'CSF Support och service',
        description: 'XLENTs centrala support kallas CSF. Kontakta dem vid behov av support.',
        order: 4,
        isBuddyTask: false,
        link: 'https://example.com/csf-support'
      },
      {
        title: 'Varumärkessidan',
        description: 'XLENT koncernen består av många olika bolag och varumärken. På den här sidan hittar du info om varumärke, logotyper, mallar etc.',
        order: 5,
        isBuddyTask: false,
        link: 'https://example.com/varumarkessidan'
      },
      {
        title: 'Ekonomi och affärssystem',
        description: 'Vi använder Maconomy för tidrapportering, attestering, reseräkningar mm. Du når Maconomy via intranätet.',
        order: 6,
        isBuddyTask: false
      },
    ]
  },
  {
    name: 'Praktiskt att fixa',
    order: 3,
    tasks: [
      {
        title: 'Presentation webbsida',
        description: 'Vi skulle gärna vilja ta ett foto på dig! Fotot ska skickas varumärkesansvarig, på central nivå, som lägger upp det på vår hemsida. Någon av dina nya kollegor hjälper dig med foto samt säkerställer att det skickas till rätt person.',
        order: 1,
        isBuddyTask: false,
        link: 'https://example.com/presentation-webbsida'
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
        title: 'Skapa en e-mailsignatur',
        description: 'Skapa en e-mailsignatur.',
        order: 5,
        isBuddyTask: false,
        link: 'https://example.com/email-signatur'
      },
      {
        title: 'Workplace',
        description: 'På Workplace, under Redigera profil, fyll i namnet på din chef. När du gjort det får du åtkomst till flertaletWorkplacegrupper. Självklart kan du välja att gå med i ytterligare grupper. Rekommenderade grupper: • XLENT syns och hörs • Försäljning inom XLENT • Kompetensluncher • CSF informerar • Har du hört • Fråga XLENT',
        order: 6,
        isBuddyTask: false
      },
      {
        title: 'Uppdatera personlig information i HR-system',
        description: 'Se över ICE kontakten och ev. kontonummer i HR-systemet Beneth. Du fyller i informationen under My profile respektive Manage personal info. Beneft nås via intranätet.',
        order: 7,
        isBuddyTask: false
      },
      {
        title: 'Kontaktuppgifter',
        description: 'Säkerställ att ditt telefonnummer och kostnavtiklelser dokumenteras på avseedd yta. Någon av dina nya kollegor guidar dig till rätt.',
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
  {
    name: 'Din konsultprofil',
    order: 4,
    tasks: [
      {
        title: 'Information konsultprofil',
        description: 'Läs om vad en konsultprofil är och hur du skapar en sådan',
        order: 1,
        isBuddyTask: false,
        link: 'https://example.com/information-konsultprofil'
      },
      {
        title: 'Skapa konsultprofil',
        description: 'Skapa din konsultprofil/ditt konsultcv i Cinode • Lösenord vid första inloggning= xlent123. Personligt lösenord skapas via det mail du får efter din första inloggning.',
        order: 2,
        isBuddyTask: false,
        link: 'https://example.com/skapa-konsultprofil'
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