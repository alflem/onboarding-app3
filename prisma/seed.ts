import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create a super admin organization
  const adminOrg = await prisma.organization.create({
    data: {
      name: 'System Administration',
      buddyEnabled: true,
    },
  });

  // Create a super admin user
  const hashedPassword = await hash('adminpassword', 10);
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      organizationId: adminOrg.id,
    },
  });

  // Create a demo organization
  const demoOrg = await prisma.organization.create({
    data: {
      name: 'Demo Company',
      buddyEnabled: true,
    },
  });

  // Create a demo admin user
  const demoAdminPassword = await hash('password', 10);
  const demoAdmin = await prisma.user.create({
    data: {
      name: 'Demo Admin',
      email: 'demo-admin@example.com',
      password: demoAdminPassword,
      role: 'ADMIN',
      organizationId: demoOrg.id,
    },
  });

  // Create a demo employee
  const demoEmployeePassword = await hash('password', 10);
  const demoEmployee = await prisma.user.create({
    data: {
      name: 'Demo Employee',
      email: 'employee@example.com',
      password: demoEmployeePassword,
      role: 'EMPLOYEE',
      organizationId: demoOrg.id,
      buddyId: demoAdmin.id, // Set the admin as the buddy for this employee
    },
  });

  // Create a checklist for the demo organization
  const demoChecklist = await prisma.checklist.create({
    data: {
      organizationId: demoOrg.id,
    },
  });

  // Create categories for the checklist
  const categories = [
    {
      name: 'Före första dagen',
      order: 1,
      tasks: [
        { title: 'Skicka välkomstmail', description: 'Skicka ett välkomstmail med praktisk information om första dagen.', order: 1, isBuddyTask: true },
        { title: 'Förbereda arbetsplats', description: 'Se till att arbetsplats med dator och tillbehör är förberedd.', order: 2, isBuddyTask: true },
        { title: 'Skapa användarkonton', description: 'Skapa konton för de system som den nyanställda behöver.', order: 3, isBuddyTask: true },
      ]
    },
    {
      name: 'Första dagen',
      order: 2,
      tasks: [
        { title: 'Välkomnande', description: 'Ta emot och hälsa den nyanställda välkommen.', order: 1, isBuddyTask: true },
        { title: 'Rundvandring', description: 'Visa runt på kontoret och presentera viktiga platser.', order: 2, isBuddyTask: true },
        { title: 'Systemintroduktion', description: 'Genomgång av de viktigaste systemen som används.', order: 3, isBuddyTask: true },
        { title: 'Säkerhet och rutiner', description: 'Gå igenom säkerhetsrutiner, nycklar och passerkort.', order: 4, isBuddyTask: false },
      ]
    },
    {
      name: 'Första veckan',
      order: 3,
      tasks: [
        { title: 'Presentationsrunda', description: 'Presentera medarbetare och viktiga kontaktpersoner.', order: 1, isBuddyTask: true },
        { title: 'Personalmöte', description: 'Delta i personalmöte för att få en bild av organisationen.', order: 2, isBuddyTask: false },
        { title: 'IT-säkerhetsutbildning', description: 'Genomgå grundläggande IT-säkerhetsutbildning.', order: 3, isBuddyTask: false },
        { title: 'Inställning av verktyg', description: 'Anpassa verktyg och inställningar efter egna preferenser.', order: 4, isBuddyTask: false },
      ]
    },
    {
      name: 'Första månaden',
      order: 4,
      tasks: [
        { title: 'Uppföljningsmöte', description: 'Genomför ett uppföljningsmöte med närmaste chef.', order: 1, isBuddyTask: true },
        { title: 'Fördjupad utbildning', description: 'Genomgå fördjupad utbildning inom arbetsområdet.', order: 2, isBuddyTask: false },
        { title: 'Projektintroduktion', description: 'Introduktion till pågående projekt och ansvarsområden.', order: 3, isBuddyTask: false },
        { title: 'Feedback', description: 'Ge feedback på onboardingprocessen.', order: 4, isBuddyTask: false },
      ]
    },
  ];

  // Create categories and tasks
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
        },
      });

      // Create task progress for the demo employee
      await prisma.taskProgress.create({
        data: {
          userId: demoEmployee.id,
          taskId: task.id,
          completed: Math.random() > 0.7, // Randomly mark some tasks as completed
        },
      });
    }
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