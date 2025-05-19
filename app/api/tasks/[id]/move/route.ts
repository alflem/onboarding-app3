// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from "@/app/api/auth/auth-options";
// import { prisma } from "@/lib/prisma";

// // Ändra interface för att matcha Next.js typkonvention
// interface RouteContext {
//   params: Promise<{ id: string }>
// }

// // PATCH /api/tasks/[id]/move - Flytta en uppgift till en annan kategori
// export async function PATCH(request: NextRequest, context: RouteContext) {
//   try {
//     // Hämta användarsession
//     const session = await getServerSession(authOptions);

//     // Kontrollera om användaren är inloggad
//     if (!session?.user) {
//       return NextResponse.json(
//         { error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     // Kontrollera att användaren har behörighet (admin eller super_admin)
//     if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
//       return NextResponse.json(
//         { error: 'Forbidden' },
//         { status: 403 }
//       );
//     }

//     // Hämta uppgifts-id från URL:en - med await eftersom params är Promise
//     const params = await context.params;
//     const { id } = params;

//     // Hämta och validera begäransdata
//     const body = await request.json();

//     if (!body.categoryId) {
//       return NextResponse.json(
//         { error: 'Kategori ID krävs' },
//         { status: 400 }
//       );
//     }

//     if (body.order === undefined || body.order === null) {
//       return NextResponse.json(
//         { error: 'Ordning krävs' },
//         { status: 400 }
//       );
//     }

//     // Hämta existerande uppgift för att verifiera ägarskap
//     const existingTask = await prisma.task.findUnique({
//       where: {
//         id: id
//       },
//       include: {
//         category: {
//           include: {
//             template: {
//               select: {
//                 organizationId: true,
//                 id: true
//               }
//             }
//           }
//         }
//       }
//     });

//     // Kontrollera om uppgiften finns
//     if (!existingTask) {
//       return NextResponse.json(
//         { error: 'Uppgiften hittades inte' },
//         { status: 404 }
//       );
//     }

//     // Kontrollera om användaren har tillgång till uppgiften
//     if (existingTask.category.template.organizationId !== session.user.organization.id) {
//       return NextResponse.json(
//         { error: 'Forbidden' },
//         { status: 403 }
//       );
//     }

//     // Verifiera att den nya kategorin existerar och tillhör samma mall
//     const targetCategory = await prisma.category.findUnique({
//       where: {
//         id: body.categoryId
//       },
//       include: {
//         template: {
//           select: {
//             id: true,
//             organizationId: true
//           }
//         }
//       }
//     });

//     if (!targetCategory) {
//       return NextResponse.json(
//         { error: 'Målkategorin hittades inte' },
//         { status: 404 }
//       );
//     }

//     // Kontrollera att målkategorin tillhör samma mall
//     if (targetCategory.template.id !== existingTask.category.template.id) {
//       return NextResponse.json(
//         { error: 'Kan inte flytta uppgift till en kategori i en annan mall' },
//         { status: 400 }
//       );
//     }

//     // Uppdatera uppgift med ny kategori och ordning
//     const updatedTask = await prisma.task.update({
//       where: {
//         id: id
//       },
//       data: {
//         categoryId: body.categoryId,
//         order: body.order
//       }
//     });

//     return NextResponse.json(updatedTask);

//   } catch (error) {
//     console.error('Fel vid flyttning av uppgift:', error);
//     return NextResponse.json(
//       { error: 'Kunde inte flytta uppgift' },
//       { status: 500 }
//     );
//   }
// }