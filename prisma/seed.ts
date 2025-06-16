import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

  // Create or find demo organization
  let demoOrg = await prisma.organization.findFirst({
    where: { name: 'Demo Company' }
  });

  if (!demoOrg) {
    demoOrg = await prisma.organization.create({
      data: {
        name: 'Demo Company',
        buddyEnabled: true,
      },
    });
  }

  // Note: Demo users will be created automatically when they log in via Azure AD

  // Create or find checklist for the demo organization
  const demoChecklist = await prisma.checklist.upsert({
    where: { organizationId: demoOrg.id },
    update: {},
    create: {
      organizationId: demoOrg.id,
    },
  });

  // Create categories for the checklist
  const categories = [
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
          title: 'Kollegor i telefonboken (frivillig)',
          description: 'Lägg till XLENT koncern...',
          order: 2,
          isBuddyTask: false
        },
        {
          title: 'Har du all utrustning du behöver?',
          description: 'Har du all utrustning du behöver? Om inte – kontakta IT-ansvarig Christian!',
          order: 3,
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
          description: 'På vårt intranät hittar du det mesta. Hämför när du system för exempelvis tidrapportering och CV-skrivande. Här finns även Workplace - XLENTs nya för nyheter, kultur och samverkan. Ta dig tid att klicka runt!',
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

  // Create categories and tasks only if checklist is empty
  const existingCategories = await prisma.category.findMany({
    where: { checklistId: demoChecklist.id }
  });

  if (existingCategories.length === 0) {
    for (const categoryData of categories) {
      const { name, order, tasks } = categoryData;

      const category = await prisma.category.create({
        data: {
          name,
          order,
          checklistId: demoChecklist.id,
        },
      });

    // Create tasks for this category
    for (const taskData of tasks) {
      const task = await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          order: taskData.order,
          isBuddyTask: taskData.isBuddyTask,
          categoryId: category.id,
          ...(taskData.link && { link: taskData.link })
        },
      });

      // Task progress will be created when users interact with tasks
    }
  }
  } else {
    console.log('Categories already exist, skipping checklist creation');
  }

  console.log('Database has been seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });