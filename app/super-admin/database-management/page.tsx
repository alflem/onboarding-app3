"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trash2, Edit, Plus, Users, Building, CheckSquare, RefreshCw, List, UserCheck, Heart, BarChart3, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import OrganizationForm from "./components/OrganizationForm";
import UserForm from "./components/UserForm";
import PreAssignedRoleForm from "./components/PreAssignedRoleForm";
import { useLanguage } from "@/lib/language-context";
import { useTranslations } from "@/lib/translations";

interface Organization {
  id: string;
  name: string;
  buddyEnabled: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
  organizationId?: string;
  buddyId?: string;
  organization?: { id: string; name: string };
  buddy?: { id: string; name: string; email: string };
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  link?: string;
  categoryId: string;
  order: number;
  isBuddyTask: boolean;
  category: {
    id: string;
    name: string;
    checklist: {
      organization: {
        id: string;
        name: string;
      };
    };
  };
  createdAt: string;
}

interface Checklist {
  id: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    buddyEnabled: boolean;
  };
  categories: Array<{
    id: string;
    name: string;
    tasks: Task[];
  }>;
  stats: {
    totalCategories: number;
    totalTasks: number;
    buddyTasks: number;
    regularTasks: number;
  };
  createdAt: string;
}

interface BuddyData {
  organization: {
    id: string;
    name: string;
    buddyEnabled: boolean;
  };
  buddyRelations: Array<{
    id: string;
    name: string;
    email: string;
    buddy: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }>;
  potentialBuddies: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    _count: {
      buddyFor: number;
    };
  }>;
  stats: {
    totalBuddyRelations: number;
    totalPotentialBuddies: number;
    buddyEnabled: boolean;
  };
}

interface PreAssignedRole {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
  createdAt: string;
  updatedAt: string;
}

export default function DatabaseManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Språkstöd
  const { language } = useLanguage();
  const { t } = useTranslations(language);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [buddyData, setBuddyData] = useState<BuddyData[]>([]);
  const [preAssignedRoles, setPreAssignedRoles] = useState<PreAssignedRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isOrgFormOpen, setIsOrgFormOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("organizations");

  // Redirect if not SUPER_ADMIN
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "SUPER_ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  // Ladda data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [orgRes, userRes, taskRes, checklistRes, buddyRes, preAssignedRes] = await Promise.all([
        fetch("/api/super-admin/organizations"),
        fetch("/api/super-admin/users"),
        fetch("/api/super-admin/tasks"),
        fetch("/api/super-admin/checklists"),
        fetch("/api/super-admin/buddies"),
        fetch("/api/super-admin/pre-assigned-roles")
      ]);

      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setOrganizations(orgData.data);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUsers(userData.data);
      }

      if (taskRes.ok) {
        const taskData = await taskRes.json();
        setTasks(taskData.data);
      }

      if (checklistRes.ok) {
        const checklistData = await checklistRes.json();
        setChecklists(checklistData.data);
      }

      if (buddyRes.ok) {
        const buddyDataRes = await buddyRes.json();
        setBuddyData(buddyDataRes.data);
      }

      if (preAssignedRes.ok) {
        const preAssignedData = await preAssignedRes.json();
        setPreAssignedRoles(preAssignedData.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      fetchData();
    }
  }, [session]);

  // Hantera borttagning
  const handleDelete = async (endpoint: string, id: string) => {
    if (!confirm("Är du säker på att du vill ta bort detta?")) return;

    try {
      const response = await fetch(`/api/super-admin/${endpoint}?id=${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        fetchData(); // Ladda om data
      } else {
        alert("Fel vid borttagning");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Fel vid borttagning");
    }
  };

  // Hantera borttagning av fördefinierade roller
  const handleDeletePreAssignedRole = async (email: string) => {
    if (!confirm(`Är du säker på att du vill ta bort den fördefinierade rollen för ${email}?`)) return;

    try {
      const response = await fetch("/api/super-admin/pre-assigned-roles", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        fetchData(); // Ladda om data
      } else {
        const error = await response.json();
        alert(error.error || "Fel vid borttagning");
      }
    } catch (error) {
      console.error("Error deleting pre-assigned role:", error);
      alert("Fel vid borttagning");
    }
  };

  // Hantera organisationer
  const handleOrgSave = async (data: Organization) => {
    try {
      const response = await fetch("/api/super-admin/organizations", {
        method: data.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setEditingOrg(null);
        setIsOrgFormOpen(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Fel: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving organization:", error);
      alert("Fel vid sparande av organisation");
    }
  };

  // Hantera användare
  const handleUserSave = async (data: User) => {
    try {
      const response = await fetch("/api/super-admin/users", {
        method: data.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setEditingUser(null);
        setIsUserFormOpen(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Fel: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Fel vid sparande av användare");
    }
  };

  // Öppna formulär för att skapa nya poster
  const openCreateForm = () => {
    if (currentTab === "organizations") {
      setEditingOrg(null);
      setIsOrgFormOpen(true);
    } else if (currentTab === "users") {
      setEditingUser(null);
      setIsUserFormOpen(true);
    } else if (currentTab === "tasks") {
      // Navigera till admin-panelen för att skapa uppgifter
      router.push("/admin");
    }
  };

  // Öppna formulär för att redigera befintliga poster
  const openEditForm = (item: Organization | User | Task) => {
    if (currentTab === "organizations") {
      setEditingOrg(item as Organization);
      setIsOrgFormOpen(true);
    } else if (currentTab === "users") {
      setEditingUser(item as User);
      setIsUserFormOpen(true);
    } else if (currentTab === "tasks") {
      // Navigera till admin-panelen för att redigera uppgifter
      router.push("/admin");
    }
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">{t('loading')}</div>;
  }

  if (session?.user?.role !== "SUPER_ADMIN") {
    return <div className="flex items-center justify-center min-h-screen">{t('access_denied')}</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Building className="h-8 w-8" />
          <h1 className="text-3xl font-bold">{t('database_management')}</h1>
          <Badge variant="destructive">SUPER_ADMIN</Badge>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Uppdatera
        </Button>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            {t('organizations')} ({organizations.length})
          </TabsTrigger>
          <TabsTrigger value="checklists" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Checklistor ({checklists.length})
          </TabsTrigger>
          <TabsTrigger value="buddies" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Buddy-system ({buddyData.reduce((sum, org) => sum + org.stats.totalBuddyRelations, 0)})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('users')} ({users.length})
          </TabsTrigger>
          <TabsTrigger value="pre-assigned-roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Fördefinierade Roller ({preAssignedRoles.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            {t('tasks')} ({tasks.length})
          </TabsTrigger>
        </TabsList>

        {/* Organisationer */}
        <TabsContent value="organizations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('organizations')}</CardTitle>
              <Button onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                {t('create_new')}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('buddy_enabled')}</TableHead>
                    <TableHead>{t('created')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <Badge variant={org.buddyEnabled ? "default" : "secondary"}>
                          {org.buddyEnabled ? t('yes') : t('no')}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(org.createdAt).toLocaleDateString("sv-SE")}</TableCell>
                                            <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditForm(org)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete("organizations", org.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

                {/* Checklistor */}
        <TabsContent value="checklists">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Checklistor per Organisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checklists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Inga checklistor hittades
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-4">
                  {checklists.map((checklist) => (
                    <AccordionItem key={checklist.id} value={checklist.id} className="border rounded-lg border-l-4 border-l-blue-500">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center justify-between w-full mr-4">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-lg font-semibold text-left">{checklist.organization.name}</div>
                              <div className="flex items-center gap-4 mt-1">
                                <Badge variant={checklist.organization.buddyEnabled ? "default" : "secondary"} className="text-xs">
                                  Buddy: {checklist.organization.buddyEnabled ? "Aktiverad" : "Inaktiverad"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Skapad: {new Date(checklist.createdAt).toLocaleDateString("sv-SE")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                <span className="font-semibold">{checklist.stats.totalTasks} uppgifter</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {checklist.stats.totalCategories} kategorier
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{checklist.stats.totalTasks}</div>
                            <div className="text-sm text-blue-700">Totala uppgifter</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{checklist.stats.regularTasks}</div>
                            <div className="text-sm text-green-700">Vanliga uppgifter</div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{checklist.stats.buddyTasks}</div>
                            <div className="text-sm text-purple-700">Buddy-uppgifter</div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold">Kategorier och uppgifter:</h4>
                          <Accordion type="multiple" className="space-y-2">
                            {checklist.categories.map((category) => (
                              <AccordionItem key={category.id} value={category.id} className="border rounded-lg">
                                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                  <div className="flex items-center justify-between w-full mr-4">
                                    <h5 className="font-medium text-left">{category.name}</h5>
                                    <Badge variant="outline" className="text-xs">{category.tasks.length} uppgifter</Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-3">
                                  <div className="space-y-2">
                                    {category.tasks.map((task) => (
                                      <div key={task.id} className="p-3 bg-gray-50 rounded border-l-2 border-l-gray-300">
                                        <div className="flex items-center gap-2 mb-1">
                                          <CheckSquare className="h-3 w-3" />
                                          <span className="font-medium">{task.title}</span>
                                          {task.isBuddyTask && (
                                            <Badge variant="secondary" className="text-xs">Buddy</Badge>
                                          )}
                                          {task.link && (
                                            <Badge variant="outline" className="text-xs">Länk</Badge>
                                          )}
                                        </div>
                                        {task.description && (
                                          <div className="text-xs text-muted-foreground ml-5 mt-1">
                                            {task.description}
                                          </div>
                                        )}
                                        <div className="text-xs text-muted-foreground ml-5 mt-1">
                                          Ordning: {task.order}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Buddy-system */}
        <TabsContent value="buddies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Buddy-system per Organisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {buddyData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Inga buddyrelationer hittades
                </div>
              ) : (
                <div className="space-y-6">
                  {buddyData.map((orgData, index) => (
                    <Card key={index} className="border-l-4 border-l-pink-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{orgData.organization.name}</CardTitle>
                            <Badge variant={orgData.stats.buddyEnabled ? "default" : "secondary"} className="mt-2">
                              Buddy-funktion: {orgData.stats.buddyEnabled ? "Aktiverad" : "Inaktiverad"}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{orgData.stats.totalBuddyRelations}</div>
                            <div className="text-sm text-muted-foreground">Aktiva buddyrelationer</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Aktiva buddy-relationer */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              Aktiva Buddy-relationer ({orgData.buddyRelations.length})
                            </h4>
                            {orgData.buddyRelations.length === 0 ? (
                              <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                                Inga aktiva buddyrelationer
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {orgData.buddyRelations.map((relation) => (
                                  <div key={relation.id} className="border rounded-lg p-3 bg-green-50">
                                    <div className="font-medium">{relation.name}</div>
                                    <div className="text-sm text-muted-foreground">{relation.email}</div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Heart className="h-3 w-3 text-pink-500" />
                                      <span className="text-sm">
                                        Buddy: <strong>{relation.buddy.name}</strong>
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {relation.buddy.role}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Potentiella buddies */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Potentiella Buddies ({orgData.potentialBuddies.length})
                            </h4>
                            {orgData.potentialBuddies.length === 0 ? (
                              <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                                Inga potentiella buddies
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {orgData.potentialBuddies.map((buddy) => (
                                  <div key={buddy.id} className="border rounded-lg p-3 bg-blue-50">
                                    <div className="font-medium">{buddy.name}</div>
                                    <div className="text-sm text-muted-foreground">{buddy.email}</div>
                                    <div className="flex items-center justify-between mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {buddy.role}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        Buddy för: {buddy._count.buddyFor} personer
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Användare */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Användare</CardTitle>
              <Button onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Ny Användare
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roll</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Buddy</TableHead>
                    <TableHead>Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === "SUPER_ADMIN" ? "destructive" :
                          user.role === "ADMIN" ? "default" : "secondary"
                        }>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.organization?.name || "Ingen"}</TableCell>
                      <TableCell>{user.buddy?.name || "Ingen"}</TableCell>
                                            <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditForm(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete("users", user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Uppgifter */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Uppgifter</CardTitle>
              <Button onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Hantera Uppgifter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Info:</strong> För att skapa, redigera eller ta bort uppgifter, använd knapparna nedan som navigerar till admin-panelen där fullständig uppgiftshantering finns tillgänglig.
                </p>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="table-fixed w-full" style={{ tableLayout: 'fixed' }}>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/3 break-words">Titel & Beskrivning</TableHead>
                        <TableHead className="w-1/6 break-words">Organisation</TableHead>
                        <TableHead className="w-1/6 break-words">Kategori</TableHead>
                        <TableHead className="w-16">Ordning</TableHead>
                        <TableHead className="w-20">Buddy</TableHead>
                        <TableHead className="w-16">Länk</TableHead>
                        <TableHead className="w-24">Åtgärder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id} className="align-top">
                          <TableCell className="font-medium break-words overflow-hidden py-4">
                            <div className="break-words">
                              <div className="font-semibold break-words overflow-wrap-anywhere whitespace-normal">{task.title}</div>
                              {task.description && (
                                <div className="text-sm text-muted-foreground mt-1 break-words overflow-wrap-anywhere whitespace-normal">
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm break-words overflow-wrap-anywhere whitespace-normal py-4">{task.category.checklist.organization.name}</TableCell>
                          <TableCell className="text-sm break-words overflow-wrap-anywhere whitespace-normal py-4">{task.category.name}</TableCell>
                          <TableCell className="text-center py-4">{task.order}</TableCell>
                          <TableCell className="py-4">
                            <Badge variant={task.isBuddyTask ? "default" : "secondary"} className="text-xs">
                              {task.isBuddyTask ? "Ja" : "Nej"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            {task.link ? (
                              <Badge variant="outline" className="text-xs">Ja</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">Nej</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex gap-1 flex-wrap">
                              <Button size="sm" variant="outline" onClick={() => openEditForm(task)} title="Gå till admin-panelen för att redigera">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete("tasks", task.id)}
                                title="Ta bort uppgift"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {tasks.map((task) => (
                  <Card key={task.id} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <div className="font-semibold text-base">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium">Organisation:</span>
                            <div className="text-muted-foreground">{task.category.checklist.organization.name}</div>
                          </div>
                          <div>
                            <span className="font-medium">Kategori:</span>
                            <div className="text-muted-foreground">{task.category.name}</div>
                          </div>
                          <div>
                            <span className="font-medium">Ordning:</span>
                            <div className="text-muted-foreground">{task.order}</div>
                          </div>
                          <div>
                            <span className="font-medium">Länk:</span>
                            <div>
                              {task.link ? (
                                <Badge variant="outline" className="text-xs">Ja</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">Nej</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <Badge variant={task.isBuddyTask ? "default" : "secondary"} className="text-xs">
                            Buddy: {task.isBuddyTask ? "Ja" : "Nej"}
                          </Badge>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditForm(task)} title="Gå till admin-panelen för att redigera">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete("tasks", task.id)}
                              title="Ta bort uppgift"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
                </TabsContent>

        {/* Fördefinierade Roller */}
        <TabsContent value="pre-assigned-roles">
          <div className="space-y-6">
            {/* Formulär för att lägga till nya fördefinierade roller */}
            <PreAssignedRoleForm onRoleAdded={fetchData} />

            {/* Lista över befintliga fördefinierade roller */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Befintliga Fördefinierade Roller
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preAssignedRoles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Inga fördefinierade roller finns ännu</p>
                    <p className="text-sm">Använd formuläret ovan för att lägga till roller</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>E-postadress</TableHead>
                            <TableHead>Roll</TableHead>
                            <TableHead>Skapad</TableHead>
                            <TableHead>Uppdaterad</TableHead>
                            <TableHead className="text-right">Åtgärder</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preAssignedRoles.map((preRole) => (
                            <TableRow key={preRole.id}>
                              <TableCell className="font-medium">{preRole.email}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    preRole.role === "SUPER_ADMIN" ? "destructive" :
                                    preRole.role === "ADMIN" ? "default" : "secondary"
                                  }
                                >
                                  {preRole.role}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(preRole.createdAt).toLocaleDateString("sv-SE")}</TableCell>
                              <TableCell>{new Date(preRole.updatedAt).toLocaleDateString("sv-SE")}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeletePreAssignedRole(preRole.email)}
                                  title={`Ta bort fördefinierad roll för ${preRole.email}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {preAssignedRoles.map((preRole) => (
                        <Card key={preRole.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-medium">{preRole.email}</div>
                              <Badge
                                variant={
                                  preRole.role === "SUPER_ADMIN" ? "destructive" :
                                  preRole.role === "ADMIN" ? "default" : "secondary"
                                }
                              >
                                {preRole.role}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                              <div>
                                <span className="font-medium">Skapad:</span> {new Date(preRole.createdAt).toLocaleDateString("sv-SE")}
                              </div>
                              <div>
                                <span className="font-medium">Uppdaterad:</span> {new Date(preRole.updatedAt).toLocaleDateString("sv-SE")}
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeletePreAssignedRole(preRole.email)}
                                title={`Ta bort fördefinierad roll för ${preRole.email}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Ta bort
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Summary Stats */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {preAssignedRoles.filter(r => r.role === "SUPER_ADMIN").length}
                        </div>
                        <div className="text-sm text-red-700">Super Admin</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {preAssignedRoles.filter(r => r.role === "ADMIN").length}
                        </div>
                        <div className="text-sm text-blue-700">Admin</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">
                          {preAssignedRoles.filter(r => r.role === "EMPLOYEE").length}
                        </div>
                        <div className="text-sm text-gray-700">Employee</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Formulär för organisationer */}
      <OrganizationForm
        isOpen={isOrgFormOpen}
        onClose={() => setIsOrgFormOpen(false)}
        organization={editingOrg ? {
          id: editingOrg.id,
          name: editingOrg.name,
          buddyEnabled: editingOrg.buddyEnabled
        } : undefined}
        onSave={(data) => handleOrgSave({
          ...data,
          id: data.id || editingOrg?.id || "",
          createdAt: editingOrg?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })}
      />

      {/* Formulär för användare */}
      <UserForm
        isOpen={isUserFormOpen}
        onClose={() => setIsUserFormOpen(false)}
        user={editingUser ? {
          id: editingUser.id,
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          organizationId: editingUser.organizationId,
          buddyId: editingUser.buddyId
        } : undefined}
        organizations={organizations}
        users={users}
        onSave={(data) => handleUserSave({
          ...data,
          id: data.id || editingUser?.id || "",
          organization: editingUser?.organization,
          buddy: editingUser?.buddy,
          createdAt: editingUser?.createdAt || new Date().toISOString()
        })}
      />

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Varning</h3>
        <p className="text-yellow-700 text-sm">
          Detta är en kraftfull admin-panel som kan ändra all data i databasen.
          Använd med försiktighet och säkerhetskopiera alltid innan du gör stora ändringar.
        </p>
      </div>
    </div>
  );
}