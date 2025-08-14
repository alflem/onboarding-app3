# Onboarding-App

En omfattande onboardingapplikation byggd med Next.js och Prisma för att förenkla introduktionen av nya medarbetare. Applikationen stödjer anpassningsbara checklistor, administratörsfunktioner och ett buddysystem för att hjälpa nya medarbetare att komma igång.

## Funktioner

- **Administratörspanel**: Hantera användare, mallar och organisationer
- **Anpassningsbara checklistor**: Skapa och administrera onboardingchecklistor
- **Buddysystem**: Tilldela erfarna medarbetare som mentorer till nya anställda
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

## Deployment till Azure App Service (Linux)

Den här appen är byggd med Next.js standalone och startas via en egen startfil. Startup command ska vara:

```
node server.js
```

### Förutsättningar
- Azure-prenumeration och en Azure App Service (Linux)
- PostgreSQL-databas (Azure Database for PostgreSQL eller motsvarande)
- Konfigurerade miljövariabler

### 1) Bygg appen
```bash
npm ci
npm run build
```
Detta skapar `.next/standalone` och `.next/static`. Filen `server.js` startar den kompilerade servern.

### 2) Artefakter att deploya
Se till att följande mappar/filer följer med i deployment:
- `.next/standalone`
- `.next/static`
- `public/`
- `server.js`
- `package.json`, `package-lock.json`

### 3) Skapa App Service
- Runtime stack: Node (t.ex. Node 18 LTS)
- OS: Linux

### 4) App Settings (miljövariabler)
I App Service → Configuration → Application settings:
- `NODE_ENV=production`
- `PORT=8080` (Azure tillhandahåller `PORT`, men 8080 är vanligt)
- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public`
- `NEXTAUTH_URL=https://<ditt-app-namn>.azurewebsites.net`
- `NEXTAUTH_SECRET=<starkt-hemligt-värde>`
- `AZURE_AD_CLIENT_ID` / `AZURE_AD_CLIENT_SECRET` / `AZURE_AD_TENANT_ID`

### 5) Startup command
App Service → Configuration → General settings → Startup Command:
```
node server.js
```

### 6) Deploy
Zip Deploy (exempel):
```bash
az webapp deployment source config-zip \
  --resource-group <RG> \
  --name <APP_NAME> \
  --src <build.zip>
```
Se till att zip:en har filerna enligt punkt 2 i rot.

### 7) Efterkontroll
- Loggar: App Service → Log stream
- Testa URL: verifiera att appen startar (annars kontrollera startup command och att `.next/standalone` finns)
- Databasåtkomst: kontrollera `DATABASE_URL` och brandväggsregler

## GitHub Actions-guide (CI/CD till Azure App Service)

Nedan är ett exempel-workflow som bygger Next.js i standalone-läge och deployar till Azure App Service. Startup command i App Service ska vara `node server.js` (se avsnitt ovan).

Skapa fil: `.github/workflows/azure-deploy.yml`

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [ "master" ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install deps
        run: npm ci

      - name: Build
        run: npm run build

      - name: Prepare artifact
        run: |
          mkdir -p deploy
          cp -r .next/standalone deploy/.next/standalone
          cp -r .next/static deploy/.next/static
          cp -r public deploy/public
          cp server.js deploy/server.js
          cp package.json deploy/package.json
          cp package-lock.json deploy/package-lock.json
          cd deploy && zip -r ../build.zip . && cd ..

      - name: Deploy to Azure WebApp
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ secrets.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: build.zip
```

Konfiguration:
- Skapa hemligheterna i GitHub repo settings → Secrets and variables → Actions:
  - `AZURE_WEBAPP_NAME`: Namnet på din App Service
  - `AZURE_WEBAPP_PUBLISH_PROFILE`: Innehållet från Publish profile (App Service → Get publish profile)

Databasmigreringar:
- Rekommenderas att köras separat (t.ex. manuell migrering via CI steg före deployment) eller som en release-rutin.
- Exempelsteg (om databasen är åtkomlig från CI):
  ```yaml
  - name: Run Prisma migrate
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    run: npx prisma migrate deploy
  ```

Obs:
- Startup command i App Service måste vara `node server.js`.
- Säkerställ att App Settings (env vars) i Azure är korrekt satta (NEXTAUTH_SECRET, DATABASE_URL, etc.).


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
