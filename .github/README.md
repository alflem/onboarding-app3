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

### Automatisk Deployment
- Push till `main` eller `master` branch triggar automatisk deployment
- Workflow kör migreringar och deployar till Azure

### Manuell Migration
1. Gå till GitHub → Actions → "Database Migration"
2. Klicka "Run workflow"
3. Välj environment (production/staging)
4. Klicka "Run workflow"

## Felsökning

Om deployment misslyckas:
1. Kontrollera att secrets är korrekt satta
2. Verifiera att Azure App Service namn matchar i workflow
3. Kolla logs i GitHub Actions

## Azure App Service Settings

Säkerställ att följande Application Settings finns i Azure:

```
PRISMA_CLI_QUERY_ENGINE_TYPE=library
PRISMA_CLIENT_ENGINE_TYPE=library
NPM_CONFIG_PRODUCTION=false
WEBSITE_NODE_DEFAULT_VERSION=22.x
```