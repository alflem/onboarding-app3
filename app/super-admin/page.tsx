"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Plus,
  Building,
  Loader2
} from "lucide-react";

// Typdefiniton för organisationer
interface Organization {
  id: string;
  name: string;
  adminCount: number;
  userCount: number;
  createdAt: string;
}

export default function SuperAdminPage() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();

  // Tillstånd för organisationsdata och UI
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrg, setNewOrg] = useState({ name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Hämta organisationer från API
  const fetchOrganizations = async () => {
    try {
      setLoading(true);

      console.log('Hämtar organisationer...');
      const response = await fetch('/api/organizations');

      if (!response.ok) {
        console.error('Fel vid hämtning:', response.status, response.statusText);
        const text = await response.text();
        console.error('Response body:', text);

        let errorMsg = 'Kunde inte hämta organisationer. Försök igen senare.';
        try {
          // Försök tolka felmeddelandet som JSON om möjligt
          const errorData = JSON.parse(text);
          if (errorData.error) errorMsg = errorData.error;
        } catch (err) {
          console.error('JSON parsing error:', err);
          // Om det inte är JSON, använd standardfelmeddelandet
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('Organisationer hämtade:', data);
      setOrganizations(data);
    } catch (error) {
      console.error('Fel vid hämtning av organisationer:', error);
      toast.error(error instanceof Error ? error.message : 'Kunde inte hämta organisationer. Försök igen senare.');
    } finally {
      setLoading(false);
    }
  };

  // Ladda organisationer när komponenten monteras
  useEffect(() => {
    if (status === "authenticated") {
      // Kontrollera att användaren är super admin
      if (session?.user.role !== "SUPER_ADMIN") {
        console.log('Användaren är inte SUPER_ADMIN:', session?.user.role);
        router.push("/");
        return;
      }

      console.log('Användaren är autentiserad som SUPER_ADMIN');
      fetchOrganizations();
    }
  }, [status, session, router]);

  // Skapa en ny organisation
  const handleAddOrganization = async () => {
    if (!newOrg.name.trim()) return;

    try {
      setIsSubmitting(true);

      console.log('Skapar organisation:', newOrg.name);
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newOrg.name }),
      });

      console.log('Svar från server:', response.status, response.statusText);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        console.error('Response content-type:', contentType);

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Error data:', errorData);
          throw new Error(errorData.error || 'Kunde inte skapa organisation');
        } else {
          // Om svaret inte är JSON, visa hela svarsinnehållet för felsökning
          const text = await response.text();
          console.error('Response text:', text);
          throw new Error('Oväntad respons från servern. Kunde inte skapa organisation.');
        }
      }

      const newOrgData = await response.json();
      console.log('Organisation skapad:', newOrgData);

      setOrganizations([...organizations, newOrgData]);
      setNewOrg({ name: "" });

      toast.success(`${newOrgData.name} har lagts till framgångsrikt.`);
    } catch (error) {
      console.error('Fel vid skapande av organisation:', error);
      toast.error(error instanceof Error ? error.message : 'Kunde inte skapa organisation');
    } finally {
      setIsSubmitting(false);
    }
  };



  if (status === "loading" || loading) {
    return (
      <div className="container flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering SuperAdminPage', { organizationsCount: organizations.length });

  return (
    <div className="container p-4 md:p-8 space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Superadmin Panel</h1>
        <p className="text-muted-foreground">
          Hantera organisationer och globala inställningar för onboarding-plattformen.
        </p>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Organisationer</h2>
      </div>

      {organizations.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisationsnamn</TableHead>
                  <TableHead>Administratörer</TableHead>
                  <TableHead>Användare</TableHead>
                  <TableHead>Skapad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow
                    key={org.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/super-admin/organizations/${org.id}`)}
                  >
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.adminCount}</TableCell>
                    <TableCell>{org.userCount}</TableCell>
                    <TableCell>{org.createdAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-medium mb-2">Inga organisationer ännu</p>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Skapa din första organisation för att börja konfigurera onboarding-plattformen.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600">
                  <Plus className="h-4 w-4" />
                  <span>Skapa organisation</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Skapa ny organisation</DialogTitle>
                  <DialogDescription>
                    Fyll i uppgifter för den nya organisationen. Efter att den skapats kan du lägga till adminanvändare.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="organizationName2">Organisationsnamn</Label>
                    <Input
                      id="organizationName2"
                      value={newOrg.name}
                      onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                      placeholder="t.ex. Företaget AB"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewOrg({ name: "" })}>
                    Avbryt
                  </Button>
                  <Button
                    onClick={handleAddOrganization}
                    disabled={isSubmitting || !newOrg.name.trim()}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Skapar...</span>
                      </>
                    ) : (
                      "Skapa organisation"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      )}
    </div>
  );
}