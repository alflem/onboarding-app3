# Super Admin Panel

En komplett admin-panel för SUPER_ADMIN användare som ger fullständig kontroll över hela systemet.

## Åtkomst

Endast användare med rollen `SUPER_ADMIN` kan komma åt dessa funktioner.

## Tillgängliga Funktioner

### 📊 Dashboard (`/super-admin/dashboard`)
- Översikt av alla admin-verktyg
- Snabbåtkomst till viktiga funktioner
- Systemstatus

### 🗄️ Databashantering (`/super-admin/database-management`)
Fullständig CRUD-funktionalitet för:

#### Organisationer
- Skapa, redigera och ta bort organisationer
- Hantera buddy-inställningar
- Se antal användare per organisation

#### Användare
- Skapa, redigera och ta bort användare
- Ändra användarroller (EMPLOYEE, ADMIN, SUPER_ADMIN)
- Tilldela användare till organisationer
- Hantera buddy-relationer
- Återställa lösenord

#### Uppgifter
- Skapa, redigera och ta bort uppgifter
- Flytta uppgifter mellan kategorier
- Markera som buddy-uppgifter
- Hantera ordning och länkar

## API Endpoints

### Organisationer
- `GET /api/super-admin/organizations` - Hämta alla organisationer
- `POST /api/super-admin/organizations` - Skapa ny organisation
- `PUT /api/super-admin/organizations` - Uppdatera organisation
- `DELETE /api/super-admin/organizations?id=<id>` - Ta bort organisation

### Användare
- `GET /api/super-admin/users` - Hämta alla användare
- `POST /api/super-admin/users` - Skapa ny användare
- `PUT /api/super-admin/users` - Uppdatera användare
- `DELETE /api/super-admin/users?id=<id>` - Ta bort användare

### Uppgifter
- `GET /api/super-admin/tasks` - Hämta alla uppgifter
- `POST /api/super-admin/tasks` - Skapa ny uppgift
- `PUT /api/super-admin/tasks` - Uppdatera uppgift
- `DELETE /api/super-admin/tasks?id=<id>` - Ta bort uppgift

## Säkerhet

- Alla endpoints kontrollerar att användaren har `SUPER_ADMIN` roll
- Automatisk omdirigering om otillräcklig behörighet
- Alla operationer loggas för säkerhet

## Användning

1. Logga in som SUPER_ADMIN
2. Gå till `/super-admin/dashboard` för översikt
3. Välj `Databashantering` för fullständig kontroll
4. Använd formulären för att skapa/redigera poster
5. Klicka på Edit-ikonen för att redigera befintliga poster
6. Klicka på Trash-ikonen för att ta bort poster

## Varningar

⚠️ **VIKTIGT**: Dessa verktyg ger fullständig kontroll över systemet. Använd med stor försiktighet:

- Att ta bort organisationer raderar även all associerad data
- Att ändra användarroller påverkar deras behörigheter omedelbart
- Att ta bort uppgifter påverkar alla användares progress

## Backup

Säkerhetskopiera alltid databasen innan du gör stora ändringar via admin-panelen.