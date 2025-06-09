# Azure App Service Environment Variables Setup

## Required Environment Variables for NextAuth.js on Azure

Add these in Azure Portal → App Service → Configuration → Application Settings:

### 1. Authentication Variables
```
NEXTAUTH_URL=https://onboarding-app-bnb2bdhsasc3a6d4.swedencentral-01.azurewebsites.net
NEXTAUTH_URL_INTERNAL=https://onboarding-app-bnb2bdhsasc3a6d4.swedencentral-01.azurewebsites.net
NEXTAUTH_SECRET=your-secret-key-here
AUTH_SECRET=your-secret-key-here
```

### 2. Azure AD Variables
```
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
```

### 3. Database Variables
```
DATABASE_URL=your-database-connection-string
```

### 4. Node.js Configuration
```
WEBSITE_NODE_DEFAULT_VERSION=~20
```

### 5. Azure App Service Startup Command
In Azure Portal → App Service → Configuration → General Settings:

**Startup Command:**
```
npm start
```

Or alternatively:
```
node server.js
```

## Azure AD App Registration Configuration

In Azure Portal → Azure Active Directory → App Registrations:

### Add Redirect URIs:
```
https://onboarding-app-bnb2bdhsasc3a6d4.swedencentral-01.azurewebsites.net/api/auth/callback/azure-ad
```

## After Setting Environment Variables

1. Save all settings in Azure App Service Configuration
2. **Restart** your App Service (this is crucial!)
3. Test authentication flow

## Common Issues:

1. **NEXTAUTH_URL must match exactly** - no trailing slashes
2. **Restart required** after setting environment variables
3. **Azure AD redirect URI must match exactly** including https://