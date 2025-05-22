"use client"
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Edit,
  Plus,
  Users,
  ClipboardList,
  User,
  UserPlus,
  CheckCircle2,
  Loader2,
  ClipboardCheck
} from "lucide-react";

// Typdefintioner
type Checklist = {
  id: string;
  organizationId: string;
  categoriesCount?: number;
  tasksCount?: number;
};

type Employee = {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  progress: number;
  hasBuddy: boolean;
};

type Buddy = {
  id: string;
  name: string;
};

export default function AdminPage() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();

  // State för datahämtning och laddningsstatus
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [buddies, setBuddies] = useState<Buddy[]>([]);

  // State för formulär
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "" });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedBuddyId, setSelectedBuddyId] = useState<string | null>(null);

  // State för åtgärder
  const [submitting, setSubmitting] = useState(false);

  // State för dialog-kontroll
  const [newEmployeeDialogOpen, setNewEmployeeDialogOpen] = useState(false);
  const [buddyDialogOpen, setBuddyDialogOpen] = useState(false);
  const [deleteEmployeeDialogOpen, setDeleteEmployeeDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      // Kontrollera att användaren är admin
      if (session?.user.role !== "ADMIN" && session?.user.role !== "SUPER_ADMIN") {
        router.push("/");
        return;
      }

      // Hämta data
      fetchChecklist();
      fetchEmployees();
      fetchBuddies();
    }
  }, [status, session, router]);

  // Funktion för att hämta eller skapa en checklista
  const fetchChecklist = async () => {
    try {
      const response = await fetch('/api/templates');

      if (!response.ok) {
        throw new Error('Kunde inte hämta checklista');
      }

      const data = await response.json();
      if (data.length > 0) {
        setChecklist(data[0]);
      } else {
        // Om ingen checklista finns, skapa en
        await createChecklist();
      }
    } catch (error) {
      console.error("Fel vid hämtning av checklista:", error);
      toast.error("Kunde inte ladda checklista", {
        description: "Ett fel uppstod vid hämtning av checklista."
      });
    } finally {
      setLoading(false);
    }
  };

  // Funktion för att skapa en checklista om ingen finns
  const createChecklist = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Kunde inte skapa checklista');
      }

      const createdChecklist = await response.json();
      setChecklist(createdChecklist);

      toast.success("Checklista skapad", {
        description: "En ny onboarding-checklista har skapats för din organisation."
      });
    } catch (error) {
      console.error("Fel vid skapande av checklista:", error);
      toast.error("Kunde inte skapa checklista", {
        description: "Ett fel uppstod vid skapande av checklista."
      });
    }
  };

  // Funktion för att hämta medarbetare från API
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');

      if (!response.ok) {
        throw new Error('Kunde inte hämta medarbetare');
      }

      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Fel vid hämtning av medarbetare:", error);
      toast.error("Kunde inte ladda medarbetare", {
        description: "Ett fel uppstod vid hämtning av medarbetare."
      });
    }
  };

  // Funktion för att hämta möjliga buddies från API
  const fetchBuddies = async () => {
    try {
      const response = await fetch('/api/buddies');

      if (!response.ok) {
        throw new Error('Kunde inte hämta buddies');
      }

      const data = await response.json();
      setBuddies(data);
    } catch (error) {
      console.error("Fel vid hämtning av buddies:", error);
      toast.error("Kunde inte ladda buddies", {
        description: "Ett fel uppstod vid hämtning av möjliga buddies."
      });
    }
  };

  // Funktion för att lägga till en ny medarbetare
  const handleAddEmployee = async () => {
    if (!newEmployee.name.trim() || !newEmployee.email.trim()) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEmployee),
      });

      if (!response.ok) {
        throw new Error('Kunde inte skapa medarbetare');
      }

      await response.json();

      fetchEmployees(); // Uppdatera listan med medarbetare
      setNewEmployee({ name: "", email: "" });
      setNewEmployeeDialogOpen(false);

      toast.success("Medarbetare tillagd", {
        description: "Den nya medarbetaren har lagts till."
      });
    } catch (error) {
      console.error("Fel vid tillägg av medarbetare:", error);
      toast.error("Kunde inte lägga till medarbetare", {
        description: "Ett fel uppstod vid tillägg av medarbetaren."
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Funktion för att ta bort en medarbetare
  const handleDeleteEmployee = async (id: string) => {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Kunde inte ta bort medarbetare');
      }

      setEmployees(employees.filter(e => e.id !== id));
      setDeleteEmployeeDialogOpen(false);
      setEmployeeToDelete(null);

      toast.success("Medarbetare borttagen", {
        description: "Medarbetaren har tagits bort från systemet."
      });
    } catch (error) {
      console.error("Fel vid borttagning av medarbetare:", error);
      toast.error("Kunde inte ta bort medarbetare", {
        description: "Ett fel uppstod vid borttagning av medarbetaren."
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Funktion för att tilldela en buddy
  const handleAssignBuddy = async () => {
    if (!selectedEmployeeId || !selectedBuddyId) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/employees/${selectedEmployeeId}/buddy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buddyId: selectedBuddyId
        }),
      });

      if (!response.ok) {
        throw new Error('Kunde inte tilldela buddy');
      }

      await response.json();

      fetchEmployees(); // Uppdatera listan med medarbetare
      setSelectedEmployeeId(null);
      setSelectedBuddyId(null);
      setBuddyDialogOpen(false);

      toast.success("Buddy tilldelad", {
        description: "Medarbetaren har tilldelats en buddy."
      });
    } catch (error) {
      console.error("Fel vid tilldelning av buddy:", error);
      toast.error("Kunde inte tilldela buddy", {
        description: "Ett fel uppstod vid tilldelning av buddy."
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Laddar administrationspanel...</span>
      </div>
    );
  }

  return (
    <div className="container p-6 space-y-8">
      <h1 className="text-3xl font-bold">Administrationspanel</h1>

      <Tabs defaultValue="checklist">
        <TabsList className="mb-4">
          <TabsTrigger value="checklist">
            <ClipboardList className="h-4 w-4 mr-2" />
            Onboarding Checklista
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="h-4 w-4 mr-2" />
            Medarbetare
          </TabsTrigger>
        </TabsList>

        {/* Checklist Management */}
        <TabsContent value="checklist" className="space-y-4">
          {checklist ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Onboarding Checklista</CardTitle>
                  <CardDescription>Hantera din organisations onboarding-checklista</CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-3/4">
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[250px]">Checklista</TableHead>
                              <TableHead>Kategorier</TableHead>
                              <TableHead>Uppgifter</TableHead>
                              <TableHead className="text-right">Åtgärder</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Onboarding Checklista</TableCell>
                              <TableCell>
                                <Badge variant="outline">{checklist.categoriesCount || 0}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{checklist.tasksCount || 0}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => router.push(`/admin/template/${checklist.id}`)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Redigera
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => router.push(`/admin/buddy-template/${checklist.id}`)}>
                                    <ClipboardCheck className="h-4 w-4 mr-2" />
                                    Buddy-uppgifter
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <div className="mt-4 text-sm text-muted-foreground">
                        <p>Redigera checklistan för att lägga till kategorier och uppgifter som nyanställda behöver slutföra under onboarding.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Ingen Checklista Hittades</CardTitle>
                <CardDescription>Din organisation har ingen checklista än</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={createChecklist} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Skapar...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Skapa Checklista
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Employee Management */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Medarbetare</CardTitle>
                <CardDescription>Hantera medarbetare och buddy-tilldelningar</CardDescription>
              </div>
              <Button onClick={() => setNewEmployeeDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Lägg till
              </Button>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Namn</TableHead>
                      <TableHead>E-post</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Buddy</TableHead>
                      <TableHead className="text-right">Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          Inga medarbetare hittades
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>{employee.name}</TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-full bg-secondary/20 rounded-full h-2.5 mr-2">
                                <div
                                  className="bg-primary h-2.5 rounded-full"
                                  style={{ width: `${employee.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs tabular-nums">{employee.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {employee.hasBuddy ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Tilldelad
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmployeeId(employee.id);
                                  setBuddyDialogOpen(true);
                                }}
                              >
                                <User className="h-3 w-3 mr-1" />
                                Tilldela buddy
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => setEmployeeToDelete(employee.id)}
                                >
                                  <User className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ta bort medarbetare?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Denna åtgärd kan inte ångras. Den valda medarbetaren och all tillhörande data kommer att tas bort permanent.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDeleteEmployee(employee.id)}
                                    disabled={submitting}
                                  >
                                    {submitting ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Tar bort...
                                      </>
                                    ) : (
                                      "Ta bort"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog för att lägga till ny medarbetare */}
      <Dialog open={newEmployeeDialogOpen} onOpenChange={setNewEmployeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lägg till ny medarbetare</DialogTitle>
            <DialogDescription>
              Fyll i uppgifterna för den nya medarbetaren.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="employee-name">Namn</Label>
              <Input
                id="employee-name"
                placeholder="Namn"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-email">E-post</Label>
              <Input
                id="employee-email"
                type="email"
                placeholder="E-post"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Avbryt</Button>
            </DialogClose>
            <Button
              onClick={handleAddEmployee}
              disabled={submitting || !newEmployee.name || !newEmployee.email}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                "Lägg till"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog för att tilldela buddy */}
      <Dialog open={buddyDialogOpen} onOpenChange={setBuddyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tilldela buddy</DialogTitle>
            <DialogDescription>
              Välj en medarbetare som ska vara buddy för den valda medarbetaren.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="buddy-select">Välj buddy</Label>
              <select
                id="buddy-select"
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedBuddyId || ""}
                onChange={(e) => setSelectedBuddyId(e.target.value)}
              >
                <option value="" disabled>Välj en buddy...</option>
                {buddies.map(buddy => (
                  <option key={buddy.id} value={buddy.id}>{buddy.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Avbryt</Button>
            </DialogClose>
            <Button
              onClick={handleAssignBuddy}
              disabled={submitting || !selectedBuddyId}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                "Tilldela"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}