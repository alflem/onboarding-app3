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
  Trash2,
  Edit,
  Plus,
  Users,
  ClipboardList,
  User,
  UserPlus,
  CheckCircle2,
  Loader2
} from "lucide-react";

// Typdefintioner
type Template = {
  id: string;
  name: string;
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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [buddies, setBuddies] = useState<Buddy[]>([]);

  // State för formulär
  const [newTemplate, setNewTemplate] = useState({ name: "" });
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "" });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedBuddyId, setSelectedBuddyId] = useState<string | null>(null);

  // State för åtgärder
  const [submitting, setSubmitting] = useState(false);



  useEffect(() => {
    if (status === "authenticated") {
      // Kontrollera att användaren är admin
      if (session?.user.role !== "ADMIN" && session?.user.role !== "SUPER_ADMIN") {
        router.push("/");
        return;
      }

      // Hämta data
      fetchTemplates();
      fetchEmployees();
      fetchBuddies();
    }
  }, [status, session, router]);

  // Funktion för att hämta mallar från API
  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');

      if (!response.ok) {
        throw new Error('Kunde inte hämta mallar');
      }

      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Fel vid hämtning av mallar:", error);
      toast.error("Kunde inte ladda mallar", {
        description: "Ett fel uppstod vid hämtning av mallar."
      });
    } finally {
      setLoading(false);
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

  // Funktion för att lägga till en ny mall
  const handleAddTemplate = async () => {
    if (!newTemplate.name.trim()) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTemplate.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Kunde inte skapa mall');
      }

      const createdTemplate = await response.json();

      setTemplates([...templates, createdTemplate]);
      setNewTemplate({ name: "" });

      toast.success("Mall skapad", {
        description: "Den nya mallen har skapats framgångsrikt."
      });
    } catch (error) {
      console.error("Fel vid skapande av mall:", error);
      toast.error("Kunde inte skapa mall", {
        description: "Ett fel uppstod vid skapande av mallen."
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Funktion för att ta bort en mall
  const handleDeleteTemplate = async (id: string) => {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Kunde inte ta bort mall');
      }

      setTemplates(templates.filter(t => t.id !== id));

      toast.success("Mall borttagen", {
        description: "Mallen har tagits bort från systemet."
      });
    } catch (error) {
      console.error("Fel vid borttagning av mall:", error);
      toast.error("Kunde inte ta bort mall", {
        description: "Ett fel uppstod vid borttagning av mallen."
      });
    } finally {
      setSubmitting(false);
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
        body: JSON.stringify({
          name: newEmployee.name,
          email: newEmployee.email,
          organizationId: session?.user.organization.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Kunde inte skapa medarbetare');
      }

      const createdEmployee = await response.json();

      setEmployees([...employees, createdEmployee]);
      setNewEmployee({ name: "", email: "" });

      toast.success("Medarbetare tillagd", {
        description: "Den nya medarbetaren har lagts till framgångsrikt."
      });
    } catch (error) {
      console.error("Fel vid skapande av medarbetare:", error);
      toast.error("Kunde inte lägga till medarbetare", {
        description: "Ett fel uppstod vid skapande av medarbetaren."
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

  // Funktion för att tilldela en buddy till en medarbetare
  const handleAssignBuddy = async () => {
    if (!selectedEmployeeId || !selectedBuddyId) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/employees/${selectedEmployeeId}/assign-buddy`, {
        method: 'POST',
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

      // Uppdatera lokal state
      setEmployees(employees.map(emp =>
        emp.id === selectedEmployeeId ? { ...emp, hasBuddy: true } : emp
      ));

      setSelectedEmployeeId(null);
      setSelectedBuddyId(null);

      toast.success("Buddy tilldelad", {
        description: "Buddy har tilldelats till medarbetaren."
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
      <div className="container p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Laddar administrationspanel...</p>
      </div>
    );
  }

  return (
    <div className="container p-4 md:p-8 space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Administrationspanel</h1>
        <p className="text-muted-foreground">
          Hantera onboarding-checklistor och medarbetare för din organisation.
        </p>
      </section>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-1">
            <ClipboardList className="h-4 w-4" />
            <span>Checklistor</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Medarbetare</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Checklistmallar</h2>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Ny mall</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Skapa ny checklistmall</DialogTitle>
                  <DialogDescription>
                    Ge din nya mall ett namn. Du kan sedan lägga till kategorier och uppgifter.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="templateName">Mallnamn</Label>
                    <Input
                      id="templateName"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="t.ex. Standard onboarding"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Avbryt</Button>
                  </DialogClose>
                  <Button
                    onClick={() => {
                      handleAddTemplate();
                      const closeButton = document.querySelector('[data-state="open"] button[aria-label="Close"]') as HTMLButtonElement;
                      closeButton?.click();
                    }}
                    disabled={!newTemplate.name.trim() || submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Skapa mall
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <ClipboardList className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Inga mallar har skapats ännu.</p>
                <p className="text-muted-foreground mb-4">Skapa din första mall för att komma igång.</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Skapa första mallen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Skapa ny checklistmall</DialogTitle>
                      <DialogDescription>
                        Ge din nya mall ett namn. Du kan sedan lägga till kategorier och uppgifter.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="templateName">Mallnamn</Label>
                        <Input
                          id="templateName"
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                          placeholder="t.ex. Standard onboarding"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Avbryt</Button>
                      </DialogClose>
                      <Button
                        onClick={() => {
                          handleAddTemplate();
                          const closeButton = document.querySelector('[data-state="open"] button[aria-label="Close"]') as HTMLButtonElement;
                          closeButton?.click();
                        }}
                        disabled={!newTemplate.name.trim() || submitting}
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Skapa mall
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-3">
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>
                      {template.categoriesCount || 0} kategorier, {template.tasksCount || 0} uppgifter
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-end gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Detta kommer att ta bort mallen permanent. Denna åtgärd kan inte ångras.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={submitting}
                          >
                            {submitting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Ta bort
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      className="gap-1"
                      onClick={() => router.push(`/admin/template/${template.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Redigera
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Medarbetare</h2>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Lägg till medarbetare</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lägg till ny medarbetare</DialogTitle>
                  <DialogDescription>
                    Fyll i uppgifter för den nya medarbetaren.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="employeeName">Namn</Label>
                    <Input
                      id="employeeName"
                      placeholder="Fullständigt namn"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="employeeEmail">E-postadress</Label>
                    <Input
                      id="employeeEmail"
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
                    onClick={() => {
                      handleAddEmployee();
                      const closeButton = document.querySelector('[data-state="open"] button[aria-label="Close"]') as HTMLButtonElement;
                      closeButton?.click();
                    }}
                    disabled={!newEmployee.name.trim() || !newEmployee.email.trim() || submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Lägg till
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {employees.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Inga medarbetare har lagts till ännu.</p>
                <p className="text-muted-foreground mb-4">Lägg till din första medarbetare för att komma igång.</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Lägg till första medarbetaren
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Lägg till ny medarbetare</DialogTitle>
                      <DialogDescription>
                        Fyll i uppgifter för den nya medarbetaren.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="employeeName">Namn</Label>
                        <Input
                          id="employeeName"
                          placeholder="Fullständigt namn"
                          value={newEmployee.name}
                          onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="employeeEmail">E-postadress</Label>
                        <Input
                          id="employeeEmail"
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
                        onClick={() => {
                          handleAddEmployee();
                          const closeButton = document.querySelector('[data-state="open"] button[aria-label="Close"]') as HTMLButtonElement;
                          closeButton?.click();
                        }}
                        disabled={!newEmployee.name.trim() || !newEmployee.email.trim() || submitting}
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Lägg till
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Namn</TableHead>
                      <TableHead>E-post</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Buddy</TableHead>
                      <TableHead className="text-right">Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="bg-muted rounded-full h-2 w-24 overflow-hidden">
                              <div
                                className="bg-primary h-full"
                                style={{ width: `${employee.progress}%` }}
                              />
                            </div>
                            <span>{employee.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {employee.hasBuddy ? (
                            <Badge variant="outline" className="bg-primary/10 flex gap-1 w-fit items-center">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Tilldelad</span>
                            </Badge>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">Tilldela buddy</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Tilldela buddy</DialogTitle>
                                  <DialogDescription>
                                    Välj vem som ska vara buddy för {employee.name}.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 py-4">
                                  <div className="font-medium">Välj buddy:</div>
                                  <div className="space-y-1">
                                    <div
                                      className={`flex items-center gap-2 p-2 border rounded-md hover:bg-accent/50 cursor-pointer ${selectedBuddyId === session?.user.id ? 'bg-accent' : ''}`}
                                      onClick={() => {
                                        setSelectedBuddyId(session?.user.id || null);
                                        setSelectedEmployeeId(employee.id);
                                      }}
                                    >
                                      <User className="h-5 w-5 text-muted-foreground" />
                                      <span>Du själv</span>
                                    </div>

                                    {buddies.map(buddy => (
                                      <div
                                        key={buddy.id}
                                        className={`flex items-center gap-2 p-2 border rounded-md hover:bg-accent/50 cursor-pointer ${selectedBuddyId === buddy.id ? 'bg-accent' : ''}`}
                                        onClick={() => {
                                          setSelectedBuddyId(buddy.id);
                                          setSelectedEmployeeId(employee.id);
                                        }}
                                      >
                                        <User className="h-5 w-5 text-muted-foreground" />
                                        <span>{buddy.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Avbryt</Button>
                                  </DialogClose>
                                  <Button
                                    onClick={() => {
                                      handleAssignBuddy();
                                      const closeButton = document.querySelector('[data-state="open"] button[aria-label="Close"]') as HTMLButtonElement;
                                      closeButton?.click();
                                    }}
                                    disabled={!selectedBuddyId || submitting}
                                  >
                                    {submitting ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : null}
                                    Tilldela
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => router.push(`/admin/employee/${employee.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Detta kommer att ta bort medarbetaren från systemet. Denna åtgärd kan inte ångras.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteEmployee(employee.id)}
                                    disabled={submitting}
                                  >
                                    {submitting ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    Ta bort
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}