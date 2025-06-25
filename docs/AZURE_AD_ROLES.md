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

## Hybrid Role Management

The application uses a hybrid approach for role management:

### Azure AD Managed Users
- **Users with Azure AD roles assigned** → Roles are locked and managed by Azure AD
- Cannot be changed locally in the organization page
- Roles sync automatically on each sign-in
- Marked as "Azure AD" in the organization management interface

### Locally Managed Users
- **Users without Azure AD roles** → Default to `EMPLOYEE` and can be managed locally
- Can be promoted/demoted through the organization page
- Marked as "Lokalt" in the organization management interface
- Once Azure AD roles are assigned, they become Azure-managed

## Important Notes

1. **Default Behavior**: Users without any assigned Azure AD roles will automatically become `EMPLOYEE`
2. **Role Priority**: Super Admin roles take precedence over Admin roles
3. **Case Insensitive**: Role matching is case-insensitive
4. **Flexible Naming**: Role names just need to contain the keywords (e.g., "System Admin", "super_admin", "Admin User" all work)
5. **Database Sync**: User roles are automatically updated in the database when they sign in if their Azure AD roles have changed
6. **Hybrid Management**: Azure AD roles take precedence - once assigned in Azure AD, local changes are disabled

## Testing

To test the hybrid role assignment:

### Testing Azure AD Managed Users
1. Assign different roles to test users in Azure AD
2. Have them sign in to the application
3. Check the console logs to see role mapping in action:
   ```
   Azure AD login - user: user@company.com, company: COMPANY, roles: ["admin"], mapped: ADMIN
   JWT callback - User user@company.com assigned to organization: COMPANY with role: ADMIN (Azure managed: true)
   ```
4. Verify the user shows "Azure AD" in the organization page and role controls are disabled

### Testing Locally Managed Users
1. Create test users without Azure AD roles
2. Have them sign in (they'll become `EMPLOYEE` by default)
3. Check they show "Lokalt" in the organization page
4. Test promoting/demoting them through the organization interface
5. Verify role changes persist and work correctly

### Testing Hybrid Behavior
1. Start with a locally managed user
2. Assign Azure AD roles to that user
3. Have them sign in again
4. Verify they become Azure-managed and controls are disabled

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

## Implementation Details

### Database Schema
The `User` model includes an `isAzureManaged` boolean field that tracks whether a user's role is managed by Azure AD:

```prisma
model User {
  // ... other fields
  role           Role           @default(EMPLOYEE)
  isAzureManaged Boolean        @default(false)
  // ... other fields
}
```

### API Protection
All role-changing endpoints check for Azure AD management:

```typescript
if (userToUpdate.isAzureManaged) {
  return NextResponse.json({ error: "Kan inte ändra roller för användare som hanteras av Azure AD" }, { status: 403 });
}
```

### Frontend Integration
The organization management interface disables role controls for Azure AD managed users and displays their management status clearly.