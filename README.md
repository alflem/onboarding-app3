# Onboarding-App

En omfattande onboarding-applikation byggd med Next.js och Prisma för att förenkla introduktionen av nya medarbetare. Applikationen stödjer anpassningsbara checklistor, administratörsfunktioner och en buddy-system för att hjälpa nya medarbetare att komma igång.

## Funktioner

- **Administratörspanel**: Hantera användare, mallar och organisationer
- **Anpassningsbara checklistor**: Skapa och administrera onboarding-checklistor
- **Buddy-system**: Tilldela erfarna medarbetare som mentorer till nya anställda
- **Användarroller**: Stöd för Super Admin, Admin och medarbetarroller
- **Autentisering**: Använder NextAuth med stöd för lösenord och OAuth
- **Databas**: PostgreSQL via Prisma ORM
- **Modern UI**: Responsiv design med Tailwind CSS och Shadcn UI-komponenter

## Teknisk stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Databas**: PostgreSQL (Docker)
- **Autentisering**: NextAuth.js
- **UI-komponenter**: Radix UI, Shadcn/UI
- **Drag and Drop**: DND Kit

## Kom igång

### Förutsättningar

- Node.js v18 eller senare
- Docker och Docker Compose
- Git

### Installation

1. Klona projektet
   ```bash
   git clone [repo-url]
   cd onboarding-app3
   ```

2. Installera beroenden
   ```bash
   npm install
   ```

3. Konfigurera miljövariabler
   Skapa en `.env` fil i roten av projektet med följande innehåll:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/onboarding_db"
   NEXTAUTH_SECRET="din_secret_key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Starta PostgreSQL med Docker
   ```bash
   docker-compose up -d
   ```

5. Kör Prisma migreringar
   ```bash
   npx prisma migrate dev
   ```

6. Ladda databasen med testdata (valfritt)
   ```bash
   npx prisma db seed
   ```

7. Starta utvecklingsservern
   ```bash
   npm run dev
   ```

8. Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare

## Projektstruktur

- `/app` - Next.js App Router-struktur med sidor och API-endpoints
- `/components` - Återanvändbara React-komponenter
- `/lib` - Hjälpfunktioner och utilities
- `/prisma` - Databasschema och migreringar
- `/public` - Statiska filer
- `/styles` - CSS och Tailwind-konfiguration

## Användning

### Användarroller

- **Super Admin**: Kan hantera hela systemet inklusive organisationer
- **Admin**: Kan hantera användare och checklistor inom sin organisation
- **Medarbetare**: Kan se och slutföra sina tilldelade checklistor

**🔄 Tillfällig konfiguration**: För närvarande får alla nya användare automatiskt Admin-rollen för att förenkla utveckling och testning.

### Flöde för nya användare

1. Den nya medarbetaren loggar in via Microsoft (Azure AD) - kontot skapas automatiskt vid första inloggningen
2. Användaren tilldelas automatiskt till "Demo Company" och får Admin-rollen (tillfällig konfiguration)
3. Administratören kan tilldela en buddy (mentor) till den nya medarbetaren
4. Administratören kan skapa och tilldela checklistor till medarbetaren
5. Medarbetaren slutför uppgifter i sin checklista, med stöd från sin buddy

## Deployment

### Azure Web App Deployment

Applikationen använder GitHub Actions för automatisk deployment till Azure Web App.

#### Standard Deployment
- **Workflow**: `.github/workflows/next-deploy.yml`
- **Trigger**: Automatisk vid push till `master` branch
- **Process**: Bygger applikationen och deployar till Azure

#### Full Clean Deployment
- **Workflow**: `.github/workflows/full_clean.yml`
- **Trigger**: Manuell via GitHub Actions
- **Process**:
  1. Säkerhetsbekräftelse (kräver att man skriver "RESET")
  2. Nollställer databasen helt (tar bort all data)
  3. Kör seed-script (om tillgängligt)
  4. Bygger och deployar applikationen

**⚠️ Varning**: Full Clean-deployment tar bort ALL data i databasen. Använd endast för utveckling eller när du medvetet vill börja om från början.

#### Använda Full Clean Deployment
1. Gå till GitHub → Actions → "Full Clean - Reset DB and Deploy"
2. Klicka "Run workflow"
3. Skriv "RESET" i bekräftelsefältet
4. Klicka "Run workflow"



## Utveckling

### Bidra till projektet

För att bidra till projektet:

1. Skapa en ny branch: `git checkout -b feature/din-feature`
2. Gör dina ändringar
3. Commita: `git commit -m 'Lägg till någon feature'`
4. Pusha: `git push origin feature/din-feature`
5. Skapa en Pull Request

### Utvecklingsmiljö

- **Standard deployment**: Automatisk vid push till `master`
- **Full clean deployment**: Manuell körning för att återställa miljön
- **Lokal utveckling**: Använd `npm run dev` för utvecklingsservern
- **Databas reset**: Använd `npx prisma db push --force-reset` lokalt för att återställa databasen

### Workflows

- **next-deploy.yml**: Standard produktionsdeployment
- **full_clean.yml**: Återställer databas och deployar (kräver manuell bekräftelse)
