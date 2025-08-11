import { PrismaClient } from '@/lib/prisma';

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
        link: 'https://www.xlent.se/hallbarakonsulter/'
      },
      {
        title: 'Intranätets startsida',
        description: 'På intranätets startsida finns mycket att läsa! Allt från information om våra processer till manualer om hur du tidrapporterar. Här hittar du också genvägar till våra viktigaste arbetsverktyg. Glöm inte att klicka dig in på Workplace - XLENTs sida för nyheter, kultur och samverkan!',
        order: 2,
        isBuddyTask: false,
        link: 'https://xlent.sharepoint.com/sites/XCg'
      },
      {
        title: 'Medarbetarresan',
        description: 'Här får du en samlad bild över våra delprocesser för dig som anställd.',
        order: 3,
        isBuddyTask: false,
        link: 'https://xlent.sharepoint.com/sites/Medarbetarresan/SitePages/Medarbetarresan.aspx'
      },
      {
        title: 'Teams',
        description: 'Teams är vår främsta kommunikationskanal samt samlingsyta för vårt interna arbete. Kika gärna runt för att bekanta dig med såväl innehåll som struktur.',
        order: 4,
        isBuddyTask: false,
        link: 'https://teams.microsoft.com/v2/'
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
        link: 'https://xcg.freshservice.com/support/home'
      },
      {
        title: 'Varumärkessidan',
        description: 'XLENT-koncernen består av många olika bolag och varumärken. På den här sidan hittar du info om varumärke, logotyper, mallar etc.',
        order: 7,
        isBuddyTask: false,
        link: 'https://xlent.sharepoint.com/sites/CentralSupportFunctions/SitePages/Varum%C3%A4rken.aspx'
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
        link: 'https://www.xlent.se/kontor/lulea'
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
        link: 'https://www.instagram.com/xlent_lulea/'
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
        link: 'https://xlent.sharepoint.com/sites/Files/Varumrken/Forms/AllItems.aspx?csf=1&web=1&e=ofLMyb&CID=fafad6b1%2Db396%2D4da1%2Db743%2D68de75e5dec1&FolderCTID=0x012000D15119D33081FB4BB68063DCB42EE7D5&id=%2Fsites%2FFiles%2FVarumrken%2FXLENT%2FMS%20Office%20mallar%20%28PPT%2C%20Word%2C%20Outlook%20sign%29%2FMailsignaturer%20Outlook%20NY'
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
        link: 'https://xlent.sharepoint.com/sites/Medarbetarresan/SitePages/F%C3%B6rm%C3%A5ner.aspx#f%C3%B6rs%C3%A4kringar'
      },
    ]
  },
];

export const DEFAULT_BUDDY_CHECKLIST_CATEGORIES = [
  {
    name: 'När nyanställning är påskriven',
    order: 1,
    tasks: [
      {
        title: 'Välkomstmail inkl. info om IT-utrustning',
        description: 'Skicka ett välkomstmail till den nyanställde! Bifoga lista över IT-utrusning som är möjlig att beställa och be den nyanställde att välja den utrusning hen behöver. Förslag på utformning av välkomstmail hittar du via länken!',
        order: 1,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Beställning av IT-utrustning',
        description: 'När den nyanställde valt IT-utrustning, prata med IT-ansvarig som fixar beställningen.',
        order: 2,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Konto i Cinode',
        description: 'Be VD beställa konto till den nyanställde i Cinode.',
        order: 3,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Dörrtagg',
        description: 'Prata med lokalgruppen, de har koll på hur beställning görs.',
        order: 4,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Den nyanställdes CV',
        description: 'Be att den nyanställde skickar sitt CV till oss, om det inte redan är gjort.',
        order: 5,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Stäm av med säljgruppen!',
        description: 'Behövs ett CV i kortform? En pitch? Prata med säljgruppen.',
        order: 6,
        isBuddyTask: true,
        link: undefined
      },
    ]
  },
  {
    name: 'Veckan innan den nyanställde börjar',
    order: 2,
    tasks: [
      {
        title: 'Maila mobilnummer till CSF Finance',
        description: 'Maila den nyanställdes mobilnummer till CSF Finance: finance@xcg.se',
        order: 1,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Beställ blommor',
        description: 'Beställ blommor, exempelvis från Interflora, till den nyanställdes hemadress. Kostnad ca 350 kr + budavgift',
        order: 2,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Förbered välkomstpåse',
        description: 'Förbered en välkomstpåse till den nyanställdes första dag. Fyll den med lite smått och gott, exempelvis med handduk, laddare, lypyl, vattenflaska, penna, reflex och en buff',
        order: 3,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Möt upp den nyanställda första dagen på kontoret',
        description: 'Säkerställ att du kan möta den nyanställda på kontoret dennes första dag. Om du inte kan, kom överens med en kollega som gör det istället.',
        order: 4,
        isBuddyTask: true,
        link: undefined
      },
    ]
  },
  {
    name: 'När den nyanställde är på plats!',
    order: 3,
    tasks: [
      {
        title: 'Teams',
        description: 'Se till att den nyanställde läggs upp i aktuella team och chattar.',
        order: 1,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Onboardingappen',
        description: 'Visa hur den nyanställde når onboardingappen och se till att hen kommer igång.',
        order: 2,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Utlämning av dörrtagg + lokalinformation',
        description: 'Be att någon ur lokalgruppen informerar om larm, nycklar och liknande. Se till att den nyanställde får sin dörrtagg.',
        order: 3,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Bjud på lunch!',
        description: 'Bjud den nyanställde på lunch under första veckan!',
        order: 4,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Se till att den nyanställde får träffa sina nya kollegor!',
        description: '',
        order: 5,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Informera om våra möten',
        description: 'Informera om regelbunda möten och ev. kommande evenemang.',
        order: 6,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Profilbutiken',
        description: 'Visa profilbutiken. Den nyanställde får välja valfri pryl för max 700 kr.',
        order: 7,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Presentera våra fokusgrupper',
        description: '',
        order: 8,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'IT-policy',
        description: 'Be IT-ansvarig informera den nyanställda om vår IT-policy.',
        order: 9,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Boka fotografering',
        description: 'Prata med rekryteringsgruppen. Sambokning görs för nyanställda en gång per år.',
        order: 10,
        isBuddyTask: true,
        link: undefined
      },
    ]
  },
  {
    name: 'Säkerställ att VD informerar den nyanställde om följande:',
    order: 4,
    tasks: [
      {
        title: 'Personalhandboken samt medarbetarresan',
        description: '',
        order: 1,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Maconomy',
        description: 'Inloggning är mailadress och lösenord "9ppuppu!" Tidkoder som är bra att känna till från början: 996-25 Semester 999-25 Interntid',
        order: 2,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Sympa',
        description: '',
        order: 3,
        isBuddyTask: true,
        link: undefined
      },
      {
        title: 'Genomgång affärsplan/årsplan',
        description: '',
        order: 4,
        isBuddyTask: true,
        link: undefined
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
        isBuddyCategory: false,
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
          link: taskData.link || null
        },
      });
    }
  }

  console.log(`Organization "${organizationName}" has been fully seeded with checklist`);
  return organization;
}

/**
 * Skapar en ny organisation och seedar den med både standardchecklistan och buddy-checklistan
 */
export async function createOrganizationWithFullChecklist(
  prisma: PrismaClient,
  organizationName: string
) {
  console.log(`Creating organization with full checklist: ${organizationName}`);

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

  // Skapa vanliga kategorier och tasks
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
          link: taskData.link || null
        },
      });
    }
  }

  // Skapa buddy-kategorier och tasks
  for (const categoryData of DEFAULT_BUDDY_CHECKLIST_CATEGORIES) {
    const { name, order, tasks } = categoryData;

    const category = await prisma.category.create({
      data: {
        name,
        order: order + DEFAULT_CHECKLIST_CATEGORIES.length, // Lägg till efter de vanliga kategorierna
        checklistId: checklist.id,
        isBuddyCategory: true,
      },
    });

    console.log(`Buddy category "${name}" created with ID: ${category.id}`);

    // Skapa tasks för denna kategori
    for (const taskData of tasks) {
      await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          order: taskData.order,
          isBuddyTask: taskData.isBuddyTask,
          categoryId: category.id,
          link: taskData.link || null
        },
      });
    }
  }

  console.log(`Organization "${organizationName}" has been fully seeded with complete checklist including buddy tasks`);
  return organization;
}

/**
 * Lägger till buddy-checklistan till en befintlig organisation
 */
export async function addBuddyChecklistToOrganization(
  prisma: PrismaClient,
  organizationId: string
) {
  console.log(`Adding buddy checklist to organization: ${organizationId}`);

  // Hämta organisationen och dess checklista
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      checklist: {
        include: {
          categories: true
        }
      }
    }
  });

  if (!organization) {
    throw new Error(`Organization with ID ${organizationId} not found`);
  }

  if (!organization.checklist) {
    throw new Error(`Organization ${organization.name} has no checklist to add buddy tasks to`);
  }

  const checklist = organization.checklist;

  // Räkna befintliga kategorier för att bestämma order
  const existingCategoriesCount = organization.checklist.categories.length;

  // Skapa buddy-kategorier och tasks
  for (const categoryData of DEFAULT_BUDDY_CHECKLIST_CATEGORIES) {
    const { name, order, tasks } = categoryData;

    const category = await prisma.category.create({
      data: {
        name,
        order: order + existingCategoriesCount, // Lägg till efter befintliga kategorier
        checklistId: checklist.id,
        isBuddyCategory: true,
      },
    });

    console.log(`Buddy category "${name}" created with ID: ${category.id}`);

    // Skapa tasks för denna kategori
    for (const taskData of tasks) {
      await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          order: taskData.order,
          isBuddyTask: taskData.isBuddyTask,
          categoryId: category.id,
          link: taskData.link || null
        },
      });
    }
  }

  console.log(`Buddy checklist successfully added to organization "${organization.name}"`);
  return organization;
}

/**
 * Lägger till buddy-checklistan till en befintlig organisation baserat på organisationsnamn
 */
export async function addBuddyChecklistToOrganizationByName(
  prisma: PrismaClient,
  organizationName: string
) {
  console.log(`Adding buddy checklist to organization: ${organizationName}`);

  // Hitta organisationen
  const organization = await prisma.organization.findFirst({
    where: { name: organizationName },
    include: {
      checklist: {
        include: {
          categories: true
        }
      }
    }
  });

  if (!organization) {
    throw new Error(`Organization "${organizationName}" not found`);
  }

  if (!organization.checklist) {
    throw new Error(`Organization "${organizationName}" has no checklist to add buddy tasks to`);
  }

  return await addBuddyChecklistToOrganization(prisma, organization.id);
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

  // Skapa ny organisation med vanlig checklista (buddy-uppgifter läggs till separat vid behov)
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