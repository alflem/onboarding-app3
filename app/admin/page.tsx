"use client"
import { useState, useEffect, useCallback } from "react";
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

  DialogClose
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";

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
  BarChart
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useTranslations } from "@/lib/translations";

// Typdefintioner
type Checklist = {
  id: string;
  organizationId: string;
  categoriesCount?: number;
  tasksCount?: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  progress: number;
  hasBuddy: boolean;
  createdAt: string;
};

type Buddy = {
  id: string;
  name: string;
};

export default function AdminPage() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();

  // Språkstöd
  const { language } = useLanguage();
  const { t } = useTranslations(language);

  // State för datahämtning och laddningsstatus
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [buddyEnabled, setBuddyEnabled] = useState<boolean>(true);

  // State för formulär
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedBuddyId, setSelectedBuddyId] = useState<string | null>(null);

  // State för åtgärder
  const [submitting, setSubmitting] = useState(false);

  // State för dialog-kontroll
  const [buddyDialogOpen, setBuddyDialogOpen] = useState(false);

  const [employeeDetailDialogOpen, setEmployeeDetailDialogOpen] = useState(false);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<string | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<{
    name: string;
    createdAt: string;
    progress: number;
    categories: { id: string; name: string; completedTasks: number; totalTasks: number }[];
    buddy?: { name: string; email: string; id: string };
  } | null>(null);

  // Funktion för att hämta organisationsinställningar
  const fetchOrganizationSettings = useCallback(async () => {
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
  }, []);

  // Funktion för att skapa en checklista om ingen finns
  const createChecklist = useCallback(async () => {
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
  }, []);

  // Funktion för att hämta eller skapa en checklista
  const fetchChecklist = useCallback(async () => {
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
  }, [createChecklist]);

  // Funktion för att hämta användare från API
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/organization/users');

      if (!response.ok) {
        throw new Error('Kunde inte hämta användare');
      }

      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Fel vid hämtning av användare:", error);
      toast.error("Kunde inte ladda användare", {
        description: "Ett fel uppstod vid hämtning av användare."
      });
    }
  }, []);

  // Funktion för att hämta möjliga buddies från API
  const fetchBuddies = useCallback(async () => {
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
  }, []);

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
      fetchUsers();
      fetchBuddies();
    }
  }, [status, session, router, fetchOrganizationSettings, fetchChecklist, fetchUsers, fetchBuddies]);

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

      fetchUsers(); // Uppdatera listan med medarbetare
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
      fetchUsers();
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
        <span className="ml-2">{t('loading_admin_panel')}</span>
      </div>
    );
  }

  return (
    <div className="container p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('administration_panel')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklista Overview */}
        <div className="lg:col-span-1">
          {checklist ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  {t('onboarding_checklist')}
                </CardTitle>
                <CardDescription>{t('your_org_checklist')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{checklist.categoriesCount || 0}</div>
                    <div className="text-sm text-muted-foreground">{t('categories')}</div>
                  </div>
                  <div className="text-center p-3 bg-secondary/20 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{checklist.tasksCount || 0}</div>
                    <div className="text-sm text-muted-foreground">{t('tasks')}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => router.push(`/admin/template/${checklist.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t('edit_checklist')}
                  </Button>
                  {buddyEnabled && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/admin/buddy-template/${checklist.id}`)}
                    >
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      {t('buddy_tasks')}
                    </Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>{t('manage_categories_tasks')}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('no_checklist')}</CardTitle>
                <CardDescription>{t('create_first_checklist')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={createChecklist} disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('creating')}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('create_checklist')}
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
                {t('users')}
              </CardTitle>
              <CardDescription>
                {buddyEnabled ? t('manage_users_and_buddy') : t('manage_users')}. {t('click_row_for_details')}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">{t('name')}</TableHead>
                      <TableHead>{t('email')}</TableHead>
                      <TableHead>{t('role')}</TableHead>
                      <TableHead>{t('progress')}</TableHead>
                      {buddyEnabled && <TableHead>Buddy</TableHead>}
                      <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={buddyEnabled ? 6 : 5} className="text-center py-8 text-muted-foreground">
                          {t('no_employees_found')}
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
                            <Badge variant={employee.role === 'ADMIN' ? 'default' : employee.role === 'SUPER_ADMIN' ? 'secondary' : 'outline'}>
                              {employee.role}
                            </Badge>
                          </TableCell>
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
                                <span className="text-muted-foreground">Ej tilldelad</span>
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
                    <BarChart className="h-5 w-5" />
                    {t('your_progress')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{t('completed_tasks')}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('tasks_completed_count', {
                          completed: employeeDetails.categories.reduce((acc, category) => acc + category.completedTasks, 0),
                          total: employeeDetails.categories.reduce((acc, category) => acc + category.totalTasks, 0)
                        })}
                      </div>
                    </div>
                    <div className="w-full bg-secondary/20 rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(employeeDetails.progress / 100) * 100}%` }}
                      ></div>
                    </div>

                    {employeeDetails.categories && (
                      <div className="space-y-2 mt-4">
                        <h4 className="text-sm font-medium">Kategorier</h4>
                        {employeeDetails.categories.map((category: { id: string; name: string; completedTasks: number; totalTasks: number }) => (
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
                      {t('configure_buddy')}
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