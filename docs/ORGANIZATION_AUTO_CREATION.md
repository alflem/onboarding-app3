# Automatisk organisationsskapande baserat på Microsoft JWT

## Översikt
Systemet skapar automatiskt organisationer baserat på `companyName` som hämtas från Microsoft JWT token när användare loggar in.

## Hur det fungerar

### 1. Inloggning med Microsoft
När en användare loggar in via Microsoft Azure AD:
- `companyName` hämtas från JWT token eller Microsoft Graph API
- Systemet kontrollerar om en organisation med det namnet redan finns

### 2. Organisationsskapande
**Om organisationen inte finns:**
- En ny organisation skapas med namnet från `companyName`
- Organisationen seedas automatiskt med en standardchecklista
- Användaren tilldelas till den nya organisationen

**Om organisationen redan finns:**
- Användaren tilldelas till den befintliga organisationen

### 3. Standardchecklista
Nya organisationer skapas med en komplett standardchecklista som innehåller:
- **Din digitala setup** - Dator, mobil, utrustning
- **Ekonomi och affärssystem** - Olika verktyg och system
- **Praktiskt att fixa** - Presentationer, foton, grupper
- **Din konsultprofil** - Konsultprofil och CV

Varje kategori innehåller specifika uppgifter, varav vissa är markerade som "buddy-uppgifter".

## Teknisk implementation

### Filer som ändrats:
- `lib/auth/organization-seeder.ts` - Ny fil för organisationsskapande och seeding
- `lib/auth/custom-prisma-adapter.ts` - Uppdaterad för att hantera companyName
- `app/api/auth/auth-options.ts` - Förbättrad logging och hantering av companyName

### Funktioner:
- `findOrCreateOrganization()` - Hittar eller skapar organisation
- `createOrganizationWithChecklist()` - Skapar organisation med standardchecklista

## Fallback-beteende
Om `companyName` inte kan hittas från JWT token:
- Användaren tilldelas till "Demo Company"
- "Demo Company" skapas automatiskt om den inte finns

## Logging
Systemet loggar alla steg för felsökning:
- Företagsnamn från JWT token
- Organisationsskapande/hittande
- Användarskapande och tilldelning
- Checklistskapande

## Exempel på flöde

```
1. User loggar in via Microsoft
2. JWT innehåller companyName: "Acme Corp"
3. System kontrollerar: Finns "Acme Corp" som organisation?
4. Om nej: Skapa "Acme Corp" + seeda med standardchecklista
5. Skapa användare och tilldela till "Acme Corp"
6. Användaren ser sin organisations checklista
```

## Konfiguration
Inga extra konfigurationer krävs. Funktionaliteten aktiveras automatiskt när:
- Microsoft Azure AD är konfigurerat
- JWT token innehåller `companyName` eller `company_name`
- Eller via Microsoft Graph API anrop