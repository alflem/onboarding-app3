# GitHub Actions Setup for Azure Deployment

## Required GitHub Secrets

För att GitHub Actions ska fungera behöver du sätta upp följande secrets i ditt GitHub repository:

### 1. AZURE_WEBAPP_PUBLISH_PROFILE
- Gå till Azure Portal → din App Service
- Klicka på "Get publish profile" (ladda ner .PublishSettings fil)
- Kopiera hela innehållet i filen och lägg till som secret

### 2. DATABASE_URL
Din Azure PostgreSQL connection string, t.ex:
```
postgresql://username:password@server.postgres.database.azure.com:5432/database?sslmode=require
```

## Sätta upp Secrets

1. Gå till GitHub repository → Settings → Secrets and variables → Actions
2. Klicka "New repository secret"
3. Lägg till båda secrets ovan

## Användning

### 📋 Workflow Strategi
- **Normalt:** Använd bara automatisk deployment (push till master)
- **Akut migration:** Använd manuell migration workflow
- **Första gången:** Använd baseline setup om du får P3005 fel

### 🚀 Automatisk Deployment (`azure-deploy.yml`)
- Push till `main` eller `master` branch triggar automatisk deployment
- Kollar automatiskt om migrations behövs för att undvika konflikter
- Hanterar både nya och befintliga databaser automatiskt
- Kör migreringar OCH deployar till Azure

### 🔄 Manuell Migration (`migrate-database.yml`)
För att köra **endast** migreringar utan deployment:
1. Gå till GitHub → Actions → "Database Migration"
2. Klicka "Run workflow"
3. Välj environment (production/staging)
4. Klicka "Run workflow"

> ⚠️ **VIKTIGT:** Kör inte manuell migration samtidigt som automatisk deployment pågår. Azure-deploy kontrollerar automatiskt om migrations behövs.

### 📋 Database Baseline Setup (`database-baseline.yml`)
**Endast för första gången** med befintlig databas:
1. Gå till GitHub → Actions → "Database Baseline Setup"
2. Klicka "Run workflow"
3. Skriv "CONFIRM" i confirm-fältet
4. Välj environment
5. Klicka "Run workflow"

> ⚠️ **OBS:** Baseline behövs bara första gången för befintliga databaser. Efter det fungerar automatiska deployments.

## Felsökning

### ❌ Migration Error P3005 (Database not empty)
**Symptom:** `The database schema is not empty`

**Lösning:**
1. Kör "Database Baseline Setup" workflow först (engångsjobb)
2. Sedan fungerar vanliga deployments automatiskt

### ❌ Deployment misslyckas
1. Kontrollera att secrets är korrekt satta:
   - `AZURE_WEBAPP_PUBLISH_PROFILE`
   - `DATABASE_URL`
2. Verifiera att Azure App Service namn matchar i workflow
3. Kolla detaljerade logs i GitHub Actions

### ❌ Prisma Client fel
Om du ser `@prisma/engines` fel:
- Workflows hanterar detta automatiskt med rätt engine-konfiguration
- Kontrollera att Azure Application Settings är korrekta

## Azure App Service Settings

Säkerställ att följande Application Settings finns i Azure:

```
PRISMA_CLI_QUERY_ENGINE_TYPE=library
PRISMA_CLIENT_ENGINE_TYPE=library
NPM_CONFIG_PRODUCTION=false
WEBSITE_NODE_DEFAULT_VERSION=22.x
```