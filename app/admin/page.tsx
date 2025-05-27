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
  CheckCircle2,
  Loader2,
  ClipboardCheck,
  Calendar,
  UserX,
  UserCheck,
  BarChart3
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
  const [buddyEnabled, setBuddyEnabled] = useState<boolean>(true);

  // State för formulär
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedBuddyId, setSelectedBuddyId] = useState<string | null>(null);

  // State för åtgärder
  const [submitting, setSubmitting] = useState(false);

  // State för dialog-kontroll
  const [buddyDialogOpen, setBuddyDialogOpen] = useState(false);
  const [deleteEmployeeDialogOpen, setDeleteEmployeeDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [employeeDetailDialogOpen, setEmployeeDetailDialogOpen] = useState(false);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<string | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);

  useEffect(() => {
    if (status === "authenticated") {
      // Kontrollera att användaren är admin
      if (session?.user.role !== "ADMIN" && session?.user.role !== "SUPER_ADMIN") {
        router.push("/");
        return;
      }

      // Hämta data
      fetchOrganizationSettings();
      fetchChecklist();
      fetchEmployees();
      fetchBuddies();
    }
  }, [status, session, router]);

  // Funktion för att hämta organisationsinställningar
  const fetchOrganizationSettings = async () => {
    try {
      const response = await fetch('/api/organization/settings');

      if (!response.ok) {
        throw new Error('Kunde inte hämta organisationsinställningar');
      }

      const data = await response.json();
      setBuddyEnabled(data.buddyEnabled);
    } catch (error) {
      console.error("Fel vid hämtning av organisationsinställningar:", error);
      // Sätt default till true om det inte går att hämta
      setBuddyEnabled(true);
    }
  };

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

  // Funktion för att hämta detaljerad information om en medarbetare
  const fetchEmployeeDetails = async (employeeId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employees/${employeeId}`);

      if (!response.ok) {
        throw new Error('Kunde inte hämta medarbetardetaljer');
      }

      const data = await response.json();
      setEmployeeDetails(data);
    } catch (error) {
      console.error("Fel vid hämtning av medarbetardetaljer:", error);
      toast.error("Kunde inte ladda medarbetardetaljer", {
        description: "Ett fel uppstod vid hämtning av medarbetarens information."
      });
    } finally {
      setLoading(false);
    }
  };

  // Funktion för att öppna medarbetardetaljer
  const handleOpenEmployeeDetails = async (employeeId: string) => {
    setSelectedEmployeeForDetail(employeeId);
    setEmployeeDetailDialogOpen(true);
    await fetchEmployeeDetails(employeeId);
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

  // Funktion för att uppdatera buddy från detaljdialogen
  const handleUpdateBuddyFromDetail = async (buddyId: string | null) => {
    if (!selectedEmployeeForDetail) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/employees/${selectedEmployeeForDetail}/buddy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buddyId: buddyId
        }),
      });

      if (!response.ok) {
        throw new Error('Kunde inte uppdatera buddy');
      }

      await response.json();

      // Uppdatera både listan och detaljerna
      fetchEmployees();
      await fetchEmployeeDetails(selectedEmployeeForDetail);

      toast.success(buddyId ? "Buddy tilldelad" : "Buddy borttagen", {
        description: buddyId ? "Medarbetaren har tilldelats en buddy." : "Buddy-tilldelningen har tagits bort."
      });
    } catch (error) {
      console.error("Fel vid uppdatering av buddy:", error);
      toast.error("Kunde inte uppdatera buddy", {
        description: "Ett fel uppstod vid uppdatering av buddy-tilldelning."
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Administrationspanel</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklista Overview */}
        <div className="lg:col-span-1">
          {checklist ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Onboarding Checklista
                </CardTitle>
                <CardDescription>Din organisations checklista</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{checklist.categoriesCount || 0}</div>
                    <div className="text-sm text-muted-foreground">Kategorier</div>
                  </div>
                  <div className="text-center p-3 bg-secondary/20 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{checklist.tasksCount || 0}</div>
                    <div className="text-sm text-muted-foreground">Uppgifter</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => router.push(`/admin/template/${checklist.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Redigera Checklista
                  </Button>
                  {buddyEnabled && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/admin/buddy-template/${checklist.id}`)}
                    >
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Buddy-uppgifter
                    </Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>Hantera kategorier och uppgifter som nyanställda behöver slutföra.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Ingen Checklista</CardTitle>
                <CardDescription>Skapa din första checklista</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={createChecklist} disabled={submitting} className="w-full">
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
        </div>

        {/* Medarbetare Management */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Medarbetare
              </CardTitle>
              <CardDescription>
                Hantera medarbetare{buddyEnabled ? ' och buddy-tilldelningar' : ''}. Klicka på en rad för detaljer.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Namn</TableHead>
                      <TableHead>E-post</TableHead>
                      <TableHead>Progress</TableHead>
                      {buddyEnabled && <TableHead>Buddy</TableHead>}
                      <TableHead className="text-right">Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={buddyEnabled ? 5 : 4} className="text-center py-4 text-muted-foreground">
                          Inga medarbetare hittades
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((employee) => (
                        <TableRow
                          key={employee.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleOpenEmployeeDetails(employee.id)}
                        >
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
                          {buddyEnabled && (
                            <TableCell>
                              {employee.hasBuddy ? (
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Tilldelad
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEmployeeId(employee.id);
                                    setBuddyDialogOpen(true);
                                  }}
                                >
                                  <User className="h-3 w-3 mr-1" />
                                  Tilldela buddy
                                </Button>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEmployeeToDelete(employee.id);
                                  }}
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
        </div>
      </div>



      {/* Dialog för att tilldela buddy */}
      {buddyEnabled && (
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
      )}

      {/* Dialog för medarbetardetaljer */}
      <Dialog open={employeeDetailDialogOpen} onOpenChange={setEmployeeDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {employeeDetails?.name || "Medarbetardetaljer"}
            </DialogTitle>
            <DialogDescription>
              Onboarding-status och buddy-hantering
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Laddar...</span>
            </div>
          ) : employeeDetails ? (
            <div className="space-y-6">
                            {/* Grundläggande information */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Startdatum</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {employeeDetails.createdAt ? new Date(employeeDetails.createdAt).toLocaleDateString('sv-SE') : 'Okänt'}
                  </p>
                </CardContent>
              </Card>

              {/* Progress översikt */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Onboarding Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Totalt framsteg</span>
                      <span className="text-sm font-bold">{employeeDetails.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary/20 rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all duration-300"
                        style={{ width: `${employeeDetails.progress}%` }}
                      ></div>
                    </div>

                    {employeeDetails.categories && (
                      <div className="space-y-2 mt-4">
                        <h4 className="text-sm font-medium">Kategorier</h4>
                        {employeeDetails.categories.map((category: any) => (
                          <div key={category.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <span className="text-sm">{category.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {category.completedTasks}/{category.totalTasks} uppgifter
                              </span>
                              <div className="w-16 bg-secondary/20 rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${(category.completedTasks / category.totalTasks) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Buddy-hantering */}
              {buddyEnabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Buddy-tilldelning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {employeeDetails.buddy ? (
                        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium text-primary">{employeeDetails.buddy.name}</p>
                              <p className="text-xs text-primary/70">{employeeDetails.buddy.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateBuddyFromDetail(null)}
                            disabled={submitting}
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                          >
                            {submitting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <UserX className="h-3 w-3 mr-1" />
                                Ta bort
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">Ingen buddy tilldelad</p>
                          <div className="space-y-2">
                            <Label htmlFor="detail-buddy-select">Välj buddy</Label>
                            <div className="flex gap-2">
                              <select
                                id="detail-buddy-select"
                                className="flex-1 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedBuddyId || ""}
                                onChange={(e) => setSelectedBuddyId(e.target.value)}
                              >
                                <option value="" disabled>Välj en buddy...</option>
                                {buddies.map(buddy => (
                                  <option key={buddy.id} value={buddy.id}>{buddy.name}</option>
                                ))}
                              </select>
                              <Button
                                onClick={() => {
                                  if (selectedBuddyId) {
                                    handleUpdateBuddyFromDetail(selectedBuddyId);
                                    setSelectedBuddyId(null);
                                  }
                                }}
                                disabled={submitting || !selectedBuddyId}
                              >
                                {submitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Tilldela"
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {employeeDetails.buddy && (
                        <div className="space-y-2">
                          <Label htmlFor="change-buddy-select">Byt buddy</Label>
                          <div className="flex gap-2">
                            <select
                              id="change-buddy-select"
                              className="flex-1 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={selectedBuddyId || ""}
                              onChange={(e) => setSelectedBuddyId(e.target.value)}
                            >
                              <option value="" disabled>Välj ny buddy...</option>
                              {buddies.filter(buddy => buddy.id !== employeeDetails.buddy?.id).map(buddy => (
                                <option key={buddy.id} value={buddy.id}>{buddy.name}</option>
                              ))}
                            </select>
                            <Button
                              onClick={() => {
                                if (selectedBuddyId) {
                                  handleUpdateBuddyFromDetail(selectedBuddyId);
                                  setSelectedBuddyId(null);
                                }
                              }}
                              disabled={submitting || !selectedBuddyId}
                            >
                              {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Byt"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Kunde inte ladda medarbetardetaljer</p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Stäng</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}