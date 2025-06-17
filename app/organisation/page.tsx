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

export default function OrganisationPage() {
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
      // Kontrollera att användaren är admin eller super admin
      if (session?.user.role !== "ADMIN" && session?.user.role !== "SUPER_ADMIN") {
        router.push("/");
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

  // Uppdatera buddy-inställningar
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
        throw new Error(errorData.error || "Kunde inte uppdatera buddy-inställningar");
      }

      const updatedOrg = await response.json();
      setOrganization(prev => prev ? { ...prev, ...updatedOrg } : null);
      toast.success(`Buddy-funktionen har ${buddyEnabled ? 'aktiverats' : 'inaktiverats'}`);

    } catch (error) {
      console.error("Fel vid uppdatering av buddy-inställningar:", error);
      toast.error(error instanceof Error ? error.message : "Kunde inte uppdatera buddy-inställningar");
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

  // Ändra superadmin-roll (endast för SUPER_ADMIN)
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

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
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
      <div className="container p-4 md:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Organisation hittades inte</h1>
          <p className="text-muted-foreground">Din organisation kunde inte hittas. Kontakta systemadministratören.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organisationshantering</h1>
          <p className="text-muted-foreground">Hantera organisationsinställningar och användare</p>
        </div>
      </div>

      {/* Organisationsinställningar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organisationsinställningar
          </CardTitle>
          <CardDescription>
            Uppdatera organisationsnamn och inställningar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Organisationsnamn */}
          <div className="space-y-2">
            <Label htmlFor="orgName">Organisationsnamn</Label>
            <div className="flex gap-2">
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Ange organisationsnamn"
                className="flex-1"
              />
              <Button
                onClick={handleUpdateOrganization}
                disabled={isSaving || !orgName.trim() || orgName === organization.name}
                size="sm"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Spara
              </Button>
            </div>
          </div>

          {/* Buddy-inställningar */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Buddy-system</Label>
              <p className="text-sm text-muted-foreground">
                Aktivera buddy-funktionen för organisationen
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={buddyEnabled}
                onCheckedChange={setBuddyEnabled}
                disabled={isSavingBuddy}
              />
              {isSavingBuddy && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleUpdateBuddySettings}
            disabled={isSavingBuddy || buddyEnabled === organization.buddyEnabled}
            variant="outline"
            size="sm"
          >
            {isSavingBuddy ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Uppdatera buddy-inställningar
          </Button>
        </CardFooter>
      </Card>

      {/* Användarhantering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Användare i organisationen ({organization.users.length})
          </CardTitle>
          <CardDescription>
            Hantera användarroller
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Namn</TableHead>
                <TableHead>E-post</TableHead>
                <TableHead>Roll</TableHead>
                <TableHead>Admin</TableHead>
                {session?.user?.role === "SUPER_ADMIN" && (
                  <TableHead>Super Admin</TableHead>
                )}
                <TableHead>Medlem sedan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organization.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === "SUPER_ADMIN"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : user.role === "ADMIN"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={user.role === "ADMIN" || user.role === "SUPER_ADMIN"}
                      onCheckedChange={(checked) => handleChangeUserRole(user.id, checked as boolean)}
                      disabled={savingUsers[user.id] || user.id === session?.user?.id}
                    />
                  </TableCell>
                  {session?.user?.role === "SUPER_ADMIN" && (
                    <TableCell>
                      <Checkbox
                        checked={user.role === "SUPER_ADMIN"}
                        onCheckedChange={(checked) => handleChangeSuperAdminRole(user.id, checked as boolean)}
                        disabled={savingUsers[user.id] || user.id === session?.user?.id}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}