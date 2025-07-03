# Buddy Checklist Seeding

Den här dokumentationen beskriver hur man använder de nya funktionerna för att seeda buddy-checklistan när en ny organisation skapas.

## Översikt

När en ny organisation skapas kan systemet automatiskt seeda den med en standardchecklista som innehåller både vanliga uppgifter och buddy-specifika uppgifter. De buddy-specifika uppgifterna är baserade på svenska processer för nyanställningsintroduktion.

## Nya funktioner

### `createOrganizationWithFullChecklist`
Skapar en ny organisation med både vanliga och buddy-uppgifter.

```typescript
import { prisma } from '@/lib/prisma';
import { createOrganizationWithFullChecklist } from '@/lib/auth/organization-seeder';

const org = await createOrganizationWithFullChecklist(prisma, 'Min Organisation AB');
```

### `addBuddyChecklistToOrganization`
Lägger till buddy-uppgifter till en befintlig organisation.

```typescript
import { addBuddyChecklistToOrganization } from '@/lib/auth/organization-seeder';

await addBuddyChecklistToOrganization(prisma, organizationId);
```

### `addBuddyChecklistToOrganizationByName`
Samma som ovan men använder organisationsnamn istället för ID.

```typescript
import { addBuddyChecklistToOrganizationByName } from '@/lib/auth/organization-seeder';

await addBuddyChecklistToOrganizationByName(prisma, 'Min Organisation AB');
```

## Automatisk seeding

Den befintliga `findOrCreateOrganization` funktionen har uppdaterats så att den automatiskt inkluderar buddy-uppgifter när en ny organisation skapas. Detta betyder att alla nya organisationer som skapas automatiskt får både vanliga och buddy-uppgifter.

## Buddy-uppgifter som seedas

### Kategori: "När nyanställning är påskriven"
- Välkomstmail inkl. information om IT-utrustning
- Beställning av IT-utrustning
- Anställningsstart och kontaktuppgifter
- Konto i Cinode
- Dörrtagg
- Den nyanställdes CV
- CV i kortform, för säljpresentation

### Kategori: "Veckan innan nyanställning börjar"
- Maila mobilnummer till CSF Finance
- Boka in XLU-lunch/fika
- Beställ blommor
- Förbered välkomstpåse
- Möt upp den nyanställda första dagen på kontoret

## Testa funktionaliteten

Du kan köra testscriptet för att se hur funktionerna fungerar:

```bash
npx tsx scripts/seed-buddy-checklist.ts
```

## Struktur

Alla buddy-uppgifter är markerade med `isBuddyTask: true` i databasen, vilket gör det möjligt att filtrera och visa dem separat i gränssnittet.

Kategorierna läggs till efter de befintliga kategorierna, så ordningen blir:
1. Befintliga kategorier (vanliga uppgifter)
2. Buddy-kategorier (buddy-uppgifter)

## Anpassning

Om du vill anpassa buddy-uppgifterna kan du redigera `DEFAULT_BUDDY_CHECKLIST_CATEGORIES` konstanten i `lib/auth/organization-seeder.ts`.