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
          description: 'Här kan du få en samlad bild över våra delprocesser för dig som anställd.',
          order: 1,
          isBuddyTask: false,
          link: 'https://example.com/medarbetarresan'
        },
        {
          title: 'XLU Teams',
          description: 'Teams används för internkommunikation inom XLENT Luleå och med kollegor i andra bolag.',
          order: 2,
          isBuddyTask: false,
          link: 'https://example.com/xlu-teams'
        },
        {
          title: 'Intranät',
          description: 'Workplace är XLENTs intranät med nyheter, kultur och samverkansforum. Klicka runt en stund så ser du vad som finns.',
          order: 3,
          isBuddyTask: false,
          link: 'https://example.com/intranet'
        },
        {
          title: 'XLUs arbetssätt',
          description: 'Under kunskapsidan hittar du beskrivningar av olika arbetssätt som vi har inom XLU. Titta igenom och fråga din buddy eller någon kollega om det är något du undrar över.',
          order: 4,
          isBuddyTask: true
        },
        {
          title: 'Bra länkar under din onboarding',
          description: 'Under länksidan hittar du länkar som kan vara bra under din onboarding.',
          order: 5,
          isBuddyTask: false
        },
        {
          title: 'CSF Support och service',
          description: 'XLENTs centrala support kallas CSF. Här hittar du frågor och svar om deras stöd.',
          order: 6,
          isBuddyTask: false,
          link: 'https://example.com/csf-support'
        },
        {
          title: 'Varumärkessidan',
          description: 'XLENT koncernen består av många olika bolag och varumärken. På den här sidan hittar du info om varumärke, logotyper, mallar etc.',
          order: 7,
          isBuddyTask: false,
          link: 'https://example.com/varumarkessidan'
        },
        {
          title: 'Ekonomi och affärssystem',
          description: 'Vi använder Maconomy för tidrapportering, attestering, reseräkningar mm. Här hittar du lathundar mm.',
          order: 8,
          isBuddyTask: false
        },
      ]
    },
    {
      name: 'Praktiskt att fixa',
      order: 3,
      tasks: [
        {
          title: 'Presentation Workplace',
          description: 'Presentera dig på Workplace, i gruppen "Hej jag är ny". Är du osäker så prata med någon kollega.',
          order: 1,
          isBuddyTask: true,
          link: 'https://example.com/presentation-workplace'
        },
        {
          title: 'Presentation webbsida',
          description: 'Skicka din bild till Tove Lejding som är centralt varumärkesansvarig så ordnar hon så att den läggs upp på XLENTs webbsida för Luleåkontoret.',
          order: 2,
          isBuddyTask: false,
          link: 'https://example.com/presentation-webbsida'
        },
        {
          title: 'Presentation Instagram',
          description: 'Be Sofia Flodmark skicka frågor för en presentation till Instagram. Skriv sedan en presentation och skicka den tillsammans med din bild till henne så lägger hon upp det på vår Instagram',
          order: 3,
          isBuddyTask: false,
          link: 'https://example.com/presentation-instagram'
        },
        {
          title: 'Uppdatera personlig information i HR-system',
          description: 'Se över ICE kontakten och ev. kontonummer. (My profile samt Manage personalinfo)',
          order: 4,
          isBuddyTask: false
        },
        {
          title: 'Email signatur',
          description: 'Skapa en signatur till email på dator och mobil',
          order: 5,
          isBuddyTask: false,
          link: 'https://example.com/email-signatur'
        },
        {
          title: 'Foto till kontoret',
          description: 'Vi sätter upp foton på våra anställda på kontoret. Se till att skriva ut ditt foto, sätt i ram och fixa så den kommer på plats på kontoret.',
          order: 6,
          isBuddyTask: false
        },
        {
          title: 'Ange chef på Workplace',
          description: 'Ange Veronica som chef (under Redigera profil). Du får då åtkomst till flera grupper välj drefter ytterligare grupper att gå med i.',
          order: 7,
          isBuddyTask: false
        },
        {
          title: 'Foto till digitala plattformar',
          description: 'Ladda upp foto: • I Office365 • På Workplace • I Cinode • I kanalen XLENT Luleå på Teams, under Files/Media/Bilder/Porträtt',
          order: 8,
          isBuddyTask: false
        },
        {
          title: 'Sjukvårdsförsäkring (frivillig)',
          description: 'Anmäl till Söderberg & Partners om sjukvårdsförsäkring (om aktuellt)',
          order: 9,
          isBuddyTask: false,
          link: 'https://example.com/sjukvardsforsakring'
        },
        {
          title: 'Kontaktuppgifter',
          description: 'Säkerställ att ditt telefonnummer och kostavtiklelser finns på vår Wiki-sida "Anteckningsbok-XLU" i Teams',
          order: 10,
          isBuddyTask: false
        },
        {
          title: 'Gå med i grupper på Workplace',
          description: 'Rekommenderade grupper: • XLENT syns och hörs • Försäljning inom XLENT • Kompetensluncher • CSF informerar • Har du hört • Fråga XLENT',
          order: 11,
          isBuddyTask: false
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
          description: 'Skapa din konsultprofil/ditt konsultcv i Cinode • Lösen första inloggning: xlent123. Ordinarie lösenord till Cinode kommer i mejl',
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