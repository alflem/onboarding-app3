"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { useTranslations } from "@/lib/translations";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Loader2,
  Save,
  User,
  Users,
  Building
} from "lucide-react";

// Typdefiitioner
interface Organization {
  id: string;
  name: string;
  buddyEnabled: boolean;
  createdAt: string;
  users: User[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function SuperAdminOrganization() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();

  // Språkstöd
  const { language } = useLanguage();
  const { t } = useTranslations(language);

  // Tillstånd
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingUsers, setSavingUsers] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBuddy, setIsSavingBuddy] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [buddyEnabled, setBuddyEnabled] = useState(true);

  // Hämta organisationsdetaljer
  const fetchOrganizationDetails = useCallback(async () => {
    try {
      setLoading(true);

      // Hämta användarens organisation
      const response = await fetch(`/api/organization`);
      if (!response.ok) {
        throw new Error("Kunde inte hämta organisationsdetaljer");
      }
      const orgData = await response.json();
      setOrganization(orgData);
      setOrgName(orgData.name);
      setBuddyEnabled(orgData.buddyEnabled);

    } catch (error) {
      console.error("Fel vid hämtning:", error);
      toast.error(error instanceof Error ? error.message : "Ett fel uppstod. Försök igen senare.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      // Endast SUPER_ADMIN får vara kvar här
      if (session?.user.role !== "SUPER_ADMIN") {
        router.replace("/organisation");
        return;
      }
      fetchOrganizationDetails();
    }
  }, [status, session, router, fetchOrganizationDetails]);

  // Uppdatera organisationsnamn
  const handleUpdateOrganization = async () => {
    if (!orgName.trim() || orgName === organization?.name) return;

    try {
      setIsSaving(true);

      const response = await fetch(`/api/organization`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: orgName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Kunde inte uppdatera organisationen");
      }

      const updatedOrg = await response.json();
      setOrganization(prev => prev ? { ...prev, ...updatedOrg } : null);
      toast.success("Organisationen har uppdaterats");

    } catch (error) {
      console.error("Fel vid uppdatering:", error);
      toast.error(error instanceof Error ? error.message : "Kunde inte uppdatera organisationen");
    } finally {
      setIsSaving(false);
    }
  };

  // Uppdatera buddyinställningar
  const handleUpdateBuddySettings = async () => {
    if (buddyEnabled === organization?.buddyEnabled) return;

    try {
      setIsSavingBuddy(true);

      const response = await fetch(`/api/organization`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ buddyEnabled: buddyEnabled })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Kunde inte uppdatera buddyinställningar");
      }

      const updatedOrg = await response.json();
      setOrganization(prev => prev ? { ...prev, ...updatedOrg } : null);
      toast.success(`Buddy-funktionen har ${buddyEnabled ? 'aktiverats' : 'inaktiverats'}`);

    } catch (error) {
      console.error("Fel vid uppdatering av buddyinställningar:", error);
      toast.error(error instanceof Error ? error.message : "Kunde inte uppdatera buddyinställningar");
      // Återställ värdet vid fel
      setBuddyEnabled(organization?.buddyEnabled || true);
    } finally {
      setIsSavingBuddy(false);
    }
  };

  // Ändra användarroll
  const handleChangeUserRole = async (userId: string, isAdmin: boolean) => {
    try {
      setSavingUsers(prev => ({ ...prev, [userId]: true }));

      const newRole = isAdmin ? "ADMIN" : "EMPLOYEE";

      console.log(`Ändrar användare ${userId} till roll: ${newRole}`);

      const response = await fetch(`/api/organization/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Kunde inte uppdatera användarroll");
      }

      const updatedUser = await response.json();

      // Uppdatera användaren i lokalt tillstånd
      setOrganization(prev => {
        if (!prev) return null;
        return {
          ...prev,
          users: prev.users.map(user =>
            user.id === userId ? updatedUser : user
          )
        };
      });

      toast.success(`Användarroll har uppdaterats till ${newRole}`);

    } catch (error) {
      console.error("Fel vid uppdatering:", error);
      toast.error(error instanceof Error ? error.message : "Kunde inte uppdatera användarroll");
    } finally {
      setSavingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Ändra superadmin-roll
  const handleChangeSuperAdminRole = async (userId: string, isSuperAdmin: boolean) => {
    try {
      setSavingUsers(prev => ({ ...prev, [userId]: true }));

      const newRole = isSuperAdmin ? "SUPER_ADMIN" : "ADMIN";

      console.log(`Ändrar användare ${userId} till roll: ${newRole}`);

      const response = await fetch(`/api/organization/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Kunde inte uppdatera användarroll");
      }

      const updatedUser = await response.json();

      // Uppdatera användaren i lokalt tillstånd
      setOrganization(prev => {
        if (!prev) return null;
        return {
          ...prev,
          users: prev.users.map(user =>
            user.id === userId ? updatedUser : user
          )
        };
      });

      toast.success(`Användarroll har uppdaterats till ${newRole}`);

    } catch (error) {
      console.error("Fel vid uppdatering:", error);
      toast.error(error instanceof Error ? error.message : "Kunde inte uppdatera användarroll");
    } finally {
      setSavingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">{t('loading')}</div>;
  }

  if (session?.user?.role !== "SUPER_ADMIN") {
    return <div className="flex items-center justify-center min-h-screen">{t('access_denied')}</div>;
  }

  if (loading) {
    return (
      <div className="container p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">{t('no_organization_found')}</h2>
            <p className="text-muted-foreground mt-2">
              {t('not_linked_to_org')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Building className="h-6 w-6" />
        <h1 className="text-3xl font-bold">{t('organization_management')}</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('basic_information')}</CardTitle>
          <CardDescription>
            {t('manage_org_settings')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="orgName">{t('organization_name')}</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={t('organization_name')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('organization_id')}</Label>
              <div className="bg-muted p-2 rounded-md text-muted-foreground text-sm font-mono">
                {organization.id}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t('created')}</Label>
              <div className="text-muted-foreground">
                {new Date(organization.createdAt).toLocaleDateString("sv-SE")}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleUpdateOrganization}
            disabled={isSaving || !orgName.trim() || orgName === organization?.name}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('save_changes')}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('buddy_system_settings')}</CardTitle>
          <CardDescription>
            {t('configure_buddy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">
                {t('enable_buddy_system')}
              </Label>
              <div className="text-sm text-muted-foreground">
                {t('buddy_help_new_employees')}
              </div>
            </div>
            <Switch
              checked={buddyEnabled}
              onCheckedChange={setBuddyEnabled}
              disabled={isSavingBuddy}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleUpdateBuddySettings}
            disabled={isSavingBuddy || buddyEnabled === organization?.buddyEnabled}
          >
            {isSavingBuddy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('save_buddy_settings')}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('users_in_organization')} ({organization.users.length})
          </CardTitle>
          <CardDescription>
            {t('manage_user_roles')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('email')}</TableHead>
                <TableHead>{t('role')}</TableHead>
                <TableHead>{t('admin')}</TableHead>
                <TableHead>{t('super_admin')}</TableHead>
                <TableHead>{t('member_since')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organization.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === "SUPER_ADMIN" ? "bg-red-100 text-red-800" :
                      user.role === "ADMIN" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={user.role === "ADMIN" || user.role === "SUPER_ADMIN"}
                      onCheckedChange={(checked) =>
                        handleChangeUserRole(user.id, checked as boolean)
                      }
                      disabled={savingUsers[user.id] || user.role === "SUPER_ADMIN"}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={user.role === "SUPER_ADMIN"}
                      onCheckedChange={(checked) =>
                        handleChangeSuperAdminRole(user.id, checked as boolean)
                      }
                      disabled={savingUsers[user.id]}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString("sv-SE")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {organization.users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('no_users_found')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}