"use client"
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, Users, HelpCircle, ExternalLink, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/language-context";
import { useTranslations } from "@/lib/translations";

interface Task {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  isBuddyTask: boolean;
  order: number;
  completed: boolean;
}

interface Category {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
}

interface ChecklistData {
  categories: Category[];
  employee?: {
    id: string;
    name: string;
    email: string;
  };
}

interface BuddyUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role: string;
}

interface BuddyPreparation {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

interface CompletedBuddyPreparation {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  notes?: string;
  createdAt: string;
  user: BuddyUser;
}

interface BuddyRelationships {
  activeUsers: BuddyUser[];
  activePreparations: BuddyPreparation[];
  completedPreparations: CompletedBuddyPreparation[];
  stats: {
    totalActiveUsers: number;
    totalActivePreparations: number;
    totalCompletedPreparations: number;
    totalAll: number;
  };
}

function BuddyChecklistContent() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checklist, setChecklist] = useState<ChecklistData>({ categories: [] });
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuddy, setIsBuddy] = useState<boolean | null>(null);
  const [buddyEnabled, setBuddyEnabled] = useState<boolean | null>(null);
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const [buddyRelationships, setBuddyRelationships] = useState<BuddyRelationships | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Språkstöd
  const { language } = useLanguage();
  const { t } = useTranslations(language);

  // Load accordion state from localStorage on component mount
  useEffect(() => {
    const savedAccordionState = localStorage.getItem('buddychecklist-accordion-state');
    if (savedAccordionState) {
      try {
        const parsedState = JSON.parse(savedAccordionState);
        setOpenAccordionItems(parsedState);
      } catch (error) {
        console.error('Error parsing accordion state from localStorage:', error);
        setOpenAccordionItems(["cat1"]); // fallback to default
      }
    } else {
      setOpenAccordionItems(["cat1"]); // default state
    }
  }, []);

  // Save accordion state to localStorage whenever it changes
  const handleAccordionChange = (value: string[]) => {
    setOpenAccordionItems(value);
    localStorage.setItem('buddychecklist-accordion-state', JSON.stringify(value));
  };

  // Kontrollera om användaren är buddy
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user/is-buddy')
        .then(response => response.json())
        .then(data => {
          setIsBuddy(data.isBuddy);
          setBuddyEnabled(data.buddyEnabled);
        })
        .catch(error => {
          console.error("Kunde inte kontrollera buddystatus:", error);
          setIsBuddy(false);
          setBuddyEnabled(false);
        });
    }
  }, [session?.user?.id]);

  const fetchChecklist = useCallback(async (employeeId?: string) => {
    try {
      setIsLoading(true);

      if (!employeeId) {
        // Om ingen anställd är vald, visa tom checklista
        setChecklist({ categories: [] });
        setProgress(0);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/checklist/employee/${employeeId}`);

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Du har inte behörighet att se denna checklista');
        } else {
          throw new Error('Kunde inte hämta checklistan');
        }
        return;
      }

      const data = await response.json();
      setChecklist(data);
      calculateProgress(data.categories);
    } catch (error) {
      console.error('Error fetching checklist:', error);
      toast.error('Ett fel uppstod när checklistan skulle hämtas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch buddy relationships
  const fetchBuddyRelationships = useCallback(async () => {
    try {
      const response = await fetch('/api/user/buddy-relationships');
      if (response.ok) {
        const data = await response.json();
        setBuddyRelationships(data.data);
      }
    } catch (error) {
      console.error('Error fetching buddy relationships:', error);
    }
  }, []);

  // Hantera URL-parametrar och initial laddning
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchBuddyRelationships();
    }
  }, [status, session, fetchBuddyRelationships]);

  // Hantera URL-parameter för anställd
  useEffect(() => {
    const employeeParam = searchParams.get('employee');
    if (employeeParam) {
      setSelectedEmployeeId(employeeParam);
    }
  }, [searchParams]);

  // Hämta checklista när anställd väljs
  useEffect(() => {
    if (selectedEmployeeId && buddyRelationships) {
      // Kontrollera att den valda personen finns i buddy-relationerna
      const isValidUser = buddyRelationships.activeUsers.some(user => user.id === selectedEmployeeId);
      const isValidPreparation = buddyRelationships.activePreparations.some(prep => prep.id === selectedEmployeeId) ||
                                  buddyRelationships.completedPreparations.some(prep => prep.id === selectedEmployeeId);

      if (isValidUser || isValidPreparation) {
        fetchChecklist(selectedEmployeeId);
      } else {
        setSelectedEmployeeId(null);
        toast.error('Du har inte behörighet att se denna persons checklista');
      }
    } else if (selectedEmployeeId === null) {
      fetchChecklist();
    }
  }, [selectedEmployeeId, buddyRelationships, fetchChecklist]);

  const calculateProgress = (categories: Category[]) => {
    let completed = 0;
    let total = 0;

    categories.forEach(category => {
      category.tasks.forEach(task => {
        total++;
        if (task.completed) {
          completed++;
        }
      });
    });

    setProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
  };

  const handleTaskChange = async (taskId: string, completed: boolean) => {
    if (!selectedEmployeeId) {
      toast.error('Ingen anställd vald');
      return;
    }

    try {
      // Uppdatera UI optimistiskt
      const updatedChecklist = {
        ...checklist,
        categories: checklist.categories.map(category => ({
          ...category,
          tasks: category.tasks.map(task =>
            task.id === taskId ? { ...task, completed } : task
          )
        }))
      };

      setChecklist(updatedChecklist);
      calculateProgress(updatedChecklist.categories);

      // Skicka uppdatering till servern för den specifika anställda
      const response = await fetch(`/api/buddy/tasks/${taskId}/progress/${selectedEmployeeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error('Kunde inte uppdatera uppgiftsstatusen');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Ett fel uppstod när uppgiftsstatusen skulle uppdateras');

      // Återställ UI till tidigare tillstånd genom att hämta data igen
      fetchChecklist(selectedEmployeeId);
    }
  };

  // Hantera val av anställd
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    // Uppdatera URL utan att ladda om sidan
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('employee', employeeId);
    router.push(newUrl.toString(), { scroll: false });
  };

  // Rensa val av anställd
  const handleClearEmployeeSelection = () => {
    setSelectedEmployeeId(null);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('employee');
    router.push(newUrl.toString(), { scroll: false });
  };

  function isCompletedBuddyPreparation(
    prep: BuddyPreparation | CompletedBuddyPreparation
  ): prep is CompletedBuddyPreparation {
    return (prep as CompletedBuddyPreparation).user !== undefined;
  }

  if (status === "loading" || isLoading) {
    return <div className="container p-8 flex justify-center">{t('loading')}</div>;
  }

  if (buddyEnabled === false) {
    return (
      <div className="container p-4 md:p-8 space-y-6">
        <section className="space-y-2">
          <h1 className="text-3xl font-bold">{t('buddy_checklist_page')}</h1>
          <p className="text-muted-foreground">
            {t('buddy_function_disabled')}
          </p>
        </section>
      </div>
    );
  }

  if (isBuddy === false) {
    return (
      <div className="container p-4 md:p-8 space-y-6">
        <section className="space-y-2">
          <h1 className="text-3xl font-bold">{t('buddy_checklist_page')}</h1>
          <p className="text-muted-foreground">
            {t('not_a_buddy')}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="container p-4 md:p-8 space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">{t('buddy_checklist_page')}</h1>
        <p className="text-muted-foreground">
          {t('tasks_to_complete_for_buddy')}
        </p>
      </section>

      {/* Buddy relationships overview */}
      {buddyRelationships && (
        <Card>
          <CardHeader className="pb-0 py-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="h-4 w-4" />
              Du är buddy för ({buddyRelationships.activeUsers.length + buddyRelationships.activePreparations.length + buddyRelationships.completedPreparations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {(buddyRelationships.activeUsers.length + buddyRelationships.activePreparations.length + buddyRelationships.completedPreparations.length) > 0 ? (
              <div className="space-y-2">
                {/* Aktiva anställda användare */}
                {buddyRelationships.activeUsers.map((user: BuddyUser) => (
                  <div key={`user-${user.id}`} className="border rounded-lg p-2 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30 w-full flex flex-col md:flex-row md:items-center md:gap-4 text-sm">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-muted-foreground">{user.email}</span>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 w-fit">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Aktiv anställd
                    </Badge>
                    <span className="text-muted-foreground text-xs">Anställd: {new Date(user.createdAt).toLocaleDateString('sv-SE')}</span>
                  </div>
                ))}

                {/* Förberedelser */}
                {[...(buddyRelationships?.activePreparations ?? []), ...(buddyRelationships?.completedPreparations ?? [])].map((prep: BuddyPreparation | CompletedBuddyPreparation) => (
                  <div key={`prep-${prep.id}`} className="border rounded-lg p-2 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30 w-full flex flex-col md:flex-row md:items-center md:gap-4 text-sm">
                    <span>{prep.firstName} {prep.lastName}</span>
                    <span className="text-muted-foreground">{prep.email || 'Ingen e-post'}</span>
                    <span className="text-muted-foreground font-medium">
                      {buddyRelationships && isCompletedBuddyPreparation(prep) ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          Slutförd förberedelse
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                          Väntar på anställning
                        </Badge>
                      )}
                    </span>
                    <span className="text-muted-foreground text-xs">Förberedd: {new Date(prep.createdAt).toLocaleDateString('sv-SE')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Du är inte buddy för någon just nu</p>
                <p className="text-xs">Kontakta din admin för att få tilldelad en buddy-roll</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Person Selector */}
      {buddyRelationships && (buddyRelationships.activeUsers.length > 0 || buddyRelationships.activePreparations.length > 0 || buddyRelationships.completedPreparations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Välj person
            </CardTitle>
            <CardDescription>
              Välj vilken person du vill se buddy-checklistan för (anställd eller förberedelse)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedEmployeeId || ""} onValueChange={handleEmployeeSelect}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Välj person..." />
                </SelectTrigger>
                <SelectContent>
                  {/* Aktiva anställda */}
                  {buddyRelationships.activeUsers.map((user) => (
                    <SelectItem key={`user-${user.id}`} value={user.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Aktiv anställd</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}

                  {/* Aktiva förberedelser */}
                  {buddyRelationships.activePreparations.map((prep) => (
                    <SelectItem key={`prep-${prep.id}`} value={prep.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{prep.firstName} {prep.lastName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{prep.email || 'Ingen e-post'}</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Väntar på anställning</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}

                  {/* Slutförda förberedelser */}
                  {buddyRelationships.completedPreparations.map((prep) => (
                    <SelectItem key={`completed-${prep.id}`} value={prep.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{prep.firstName} {prep.lastName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{prep.email || 'Ingen e-post'}</span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Slutförd förberedelse</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEmployeeId && (
                <Button variant="outline" onClick={handleClearEmployeeSelection}>
                  Rensa val
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message when no employee is selected */}
      {buddyRelationships && buddyRelationships.activeUsers.length > 0 && !selectedEmployeeId && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Välj en anställd för att se deras buddy-checklista</p>
            <p className="text-sm text-muted-foreground">Du är buddy för {buddyRelationships.activeUsers.length} person(er)</p>
          </CardContent>
        </Card>
      )}

      {/* Progress and Checklist - only show when employee is selected */}
      {selectedEmployeeId && checklist.employee && (
        <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
          <Card className="w-full md:w-64 lg:w-80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Progress för {checklist.employee.name}
              </CardTitle>
              <CardDescription>
                Slutförda buddy-uppgifter: {progress}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-4" />

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Slutförda uppgifter</span>
                  <Badge variant="outline" className="bg-secondary/10">
                    {checklist.categories.flatMap(c => c.tasks).filter(t => t.completed).length} av {checklist.categories.flatMap(c => c.tasks).length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="w-full space-y-4">
          {checklist.categories.length > 0 ? (
            <Accordion type="multiple" value={openAccordionItems} className="w-full" onValueChange={handleAccordionChange}>
              {checklist.categories.map((category) => (
                <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-2 mb-4">
                  <AccordionTrigger className="py-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      <Badge variant="outline" className="ml-2 bg-secondary/10">
                        {category.tasks.filter(t => t.completed).length}/{category.tasks.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-4">
                      {category.tasks.map((task) => (
                        <div key={task.id} className={`flex items-start gap-3 border rounded-md p-3 transition-all duration-200 ${
                          task.completed
                            ? 'bg-muted/50 opacity-60 border-muted'
                            : 'bg-card'
                        }`}>
                          <Checkbox
                            id={task.id}
                            checked={task.completed}
                            onCheckedChange={(checked) => handleTaskChange(task.id, checked as boolean)}
                            className="mt-1"
                          />
                          <div className="grid gap-1">
                            <label
                              htmlFor={task.id}
                              className={`font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-all duration-200 ${
                                task.completed ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {task.title}
                                <Badge className={`transition-all duration-200 ${
                                  task.completed
                                    ? 'bg-muted text-muted-foreground/60'
                                    : 'bg-secondary text-secondary-foreground'
                                }`}>
                                  Buddy
                                </Badge>
                              </div>
                            </label>
                            <p className={`text-sm transition-all duration-200 ${
                              task.completed ? 'text-muted-foreground/60 line-through' : 'text-muted-foreground'
                            }`}>
                              {task.description}
                            </p>
                            {task.link && (
                              <div className="mt-2">
                                <a
                                  href={task.link.startsWith('http') ? task.link : `https://${task.link}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary bg-accent border border-border rounded-md hover:bg-accent/80 hover:border-primary/30 transition-all duration-200 group"
                                >
                                  <ExternalLink className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                  {t('open_link')}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="flex justify-center items-center p-8 border rounded-md">
              <p className="text-muted-foreground">{t('no_buddy_tasks_found')}</p>
            </div>
          )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            {t('need_help')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              asChild
              variant="outline"
              className="flex items-center justify-start gap-2 h-auto py-3 px-6 w-full"
            >
              <a href="https://xcg.freshservice.com/support/home" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full h-full">
                <HelpCircle className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{t('support')}</div>
                  <div className="text-xs text-muted-foreground">{t('contact_it_support')}</div>
                </div>
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex items-center justify-start gap-2 h-auto py-3 px-6 w-full"
            >
              <a href="https://xlent.sharepoint.com/sites/XCg" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full h-full">
                <Users className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{t('intranet')}</div>
                  <div className="text-xs text-muted-foreground">{t('intranet_desc')}</div>
                </div>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BuddyChecklistPage() {
  return (
    <Suspense fallback={<div className="container p-8 flex justify-center">Laddar...</div>}>
      <BuddyChecklistContent />
    </Suspense>
  );
}