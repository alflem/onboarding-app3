# Azure AD Application Roles Integration

This document explains how to set up and configure Azure AD application roles to work with your NextAuth application.

## Overview

The application automatically maps Azure AD application roles to internal application roles:

- **No Azure role assigned** → `EMPLOYEE` (default)
- **Azure roles containing "admin"** → `ADMIN`
- **Azure roles containing "super_admin" or "superadmin"** → `SUPER_ADMIN`

## Setting up Azure AD Application Roles

### 1. Navigate to Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Select your application

### 2. Create Application Roles

1. Go to **App roles** in the left sidebar
2. Click **Create app role**
3. Create the following roles:

#### Admin Role
- **Display name**: `Admin`
- **Allowed member types**: `Users/Groups`
- **Value**: `admin`
- **Description**: `Application administrator with elevated permissions`

#### Super Admin Role
- **Display name**: `Super Admin`
- **Allowed member types**: `Users/Groups`
- **Value**: `super_admin`
- **Description**: `Super administrator with full system access`

### 3. Assign Roles to Users

1. Go to **Azure Active Directory** → **Enterprise applications**
2. Find and select your application
3. Go to **Users and groups**
4. Click **Add user/group**
5. Select users and assign the appropriate roles

## Role Mapping Logic

The application uses the following mapping logic in `mapAzureRoleToAppRole()`:

```typescript
function mapAzureRoleToAppRole(azureRoles: string[] | undefined): Role {
  if (!azureRoles || azureRoles.length === 0) {
    return Role.EMPLOYEE; // Default role when no Azure roles assigned
  }

  // Check for super admin role first (highest priority)
  if (azureRoles.some(role => role.toLowerCase().includes('super_admin') || role.toLowerCase().includes('superadmin'))) {
    return Role.SUPER_ADMIN;
  }

  // Check for admin role
  if (azureRoles.some(role => role.toLowerCase().includes('admin'))) {
    return Role.ADMIN;
  }

  // Default to employee if roles exist but don't match known patterns
  return Role.EMPLOYEE;
}
```

## Important Notes

1. **Default Behavior**: Users without any assigned Azure AD roles will automatically become `EMPLOYEE`
2. **Role Priority**: Super Admin roles take precedence over Admin roles
3. **Case Insensitive**: Role matching is case-insensitive
4. **Flexible Naming**: Role names just need to contain the keywords (e.g., "System Admin", "super_admin", "Admin User" all work)
5. **Database Sync**: User roles are automatically updated in the database when they sign in if their Azure AD roles have changed

## Testing

To test the role assignment:

1. Assign different roles to test users in Azure AD
2. Have them sign in to the application
3. Check the console logs to see role mapping in action:
   ```
   Azure AD profile callback - companyName: COMPANY, roles: ["admin"], mappedRole: ADMIN
   JWT callback - User user@company.com assigned to organization: COMPANY with role: ADMIN
   ```
4. Verify the user's role in the database or application UI

## Troubleshooting

### Roles not appearing
- Ensure the Azure AD app registration has the roles configured
- Verify users are assigned to roles in Enterprise Applications
- Check that the application has proper permissions to read roles

### Roles not updating
- Roles are only updated during sign-in
- Users may need to sign out and sign back in to get updated roles
- Check console logs for role mapping messages

### Custom Role Names
If you need to use different role names in Azure AD, update the `mapAzureRoleToAppRole()` function in `app/api/auth/auth-options.ts` to match your naming convention.