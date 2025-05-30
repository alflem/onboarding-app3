// Filsökväg: /app/super-admin/organizations/[id]/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,

  Users
} from "lucide-react";

// Typdefiitioner
interface Organization {
  id: string;
  name: string;
  buddyEnabled: boolean;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function OrganizationDetails() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;

  // Tillstånd
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
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

      // Hämta organisation
      const orgResponse = await fetch(`/api/organizations/${organizationId}`);
      if (!orgResponse.ok) {
        throw new Error("Kunde inte hämta organisationsdetaljer");
      }
      const orgData = await orgResponse.json();
      setOrganization(orgData);
      setOrgName(orgData.name);
      setBuddyEnabled(orgData.buddyEnabled);

      // Hämta användare för organisationen
      const usersResponse = await fetch(`/api/organizations/${organizationId}/users`);
      if (!usersResponse.ok) {
        throw new Error("Kunde inte hämta användarlistor");
      }
      const usersData = await usersResponse.json();
      setUsers(usersData);

    } catch (error) {
      console.error("Fel vid hämtning:", error);
      toast.error(error instanceof Error ? error.message : "Ett fel uppstod. Försök igen senare.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (status === "authenticated") {
      // Kontrollera att användaren är super admin
      if (session?.user.role !== "SUPER_ADMIN") {
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

      const response = await fetch(`/api/organizations/${organizationId}`, {
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
      setOrganization(updatedOrg);
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

      const response = await fetch(`/api/organizations/${organizationId}`, {
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
      setOrganization(updatedOrg);
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

    // Ändra här: Konvertera boolean till faktisk roll från din Role-uppräkning
    const newRole = isAdmin ? "ADMIN" : "EMPLOYEE"; // Ändra till EMPLOYEE istället för USER

    console.log(`Ändrar användare ${userId} till roll: ${newRole}`);

    const response = await fetch(`/api/organizations/${organizationId}/users/${userId}`, {
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

    // Uppdatera användarlistan
    setUsers(users.map(user =>
      user.id === userId ? { ...user, role: updatedUser.role } : user
    ));

    toast.success(`${updatedUser.name} är nu ${updatedUser.role === "ADMIN" ? "administratör" : "medarbetare"}`);

  } catch (error) {
    console.error("Fel vid uppdatering av användarroll:", error);
    toast.error(error instanceof Error ? error.message : "Kunde inte uppdatera användarroll");
  } finally {
    setSavingUsers(prev => ({ ...prev, [userId]: false }));
  }
};

  if (status === "loading" || loading) {
    return (
      <div className="container flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Laddar organisationsdetaljer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/super-admin")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Organisationshantering</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Grundläggande information</CardTitle>
          <CardDescription>
            Hantera organisationens grundläggande inställningar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="orgName">Organisationsnamn</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Organisationsnamn"
              />
            </div>
            <div className="grid gap-2">
              <Label>Organisation ID</Label>
              <div className="bg-muted p-2 rounded-md text-muted-foreground text-sm font-mono">
                {organizationId}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Skapad</Label>
              <div className="text-muted-foreground">
                {organization?.createdAt}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleUpdateOrganization}
            disabled={isSaving || !orgName.trim() || orgName === organization?.name}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Sparar...</span>
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                <span>Spara ändringar</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Buddy-inställningar
          </CardTitle>
          <CardDescription>
            Hantera buddy-funktionalitet för denna organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="buddy-enabled">Aktivera buddy-funktionen</Label>
              <p className="text-sm text-muted-foreground">
                När aktiverad kan administratörer tilldela buddies till nyanställda medarbetare
              </p>
            </div>
            <Switch
              id="buddy-enabled"
              checked={buddyEnabled}
              onCheckedChange={setBuddyEnabled}
              disabled={isSavingBuddy}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleUpdateBuddySettings}
            disabled={isSavingBuddy || buddyEnabled === organization?.buddyEnabled}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isSavingBuddy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Sparar...</span>
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                <span>Spara buddy-inställningar</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Användare</h2>
      </div>

      {users.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namn</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Skapad</TableHead>
                  <TableHead>Administratör</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.createdAt}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`admin-${user.id}`}
                          checked={user.role === "ADMIN"}
                          onCheckedChange={(checked) => handleChangeUserRole(user.id, checked as boolean)}
                          disabled={savingUsers[user.id]}
                          className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                        />
                        {savingUsers[user.id] && (
                          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-medium mb-2">Inga användare ännu</p>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Det finns inga användare i denna organisation ännu.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}