"use client"
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
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
import { Info, Users, HelpCircle, ExternalLink, UserCheck, Clock, CheckCircle2 } from "lucide-react";
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

export default function BuddyChecklistPage() {
  const { data: session, status } = useSession({ required: true });
  const [checklist, setChecklist] = useState<ChecklistData>({ categories: [] });
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuddy, setIsBuddy] = useState<boolean | null>(null);
  const [buddyEnabled, setBuddyEnabled] = useState<boolean | null>(null);
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const [buddyRelationships, setBuddyRelationships] = useState<BuddyRelationships | null>(null);

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

  const fetchChecklist = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/checklist`);

      if (!response.ok) {
        throw new Error('Kunde inte hämta checklistan');
      }

      const data = await response.json();

      // Filter to only include categories with buddy tasks
      const buddyData = {
        categories: data.categories.map((category: Category) => ({
          ...category,
          tasks: category.tasks.filter((task: Task) => task.isBuddyTask)
        })).filter((category: Category) => category.tasks.length > 0)
      };

      setChecklist(buddyData);
      calculateProgress(buddyData.categories);
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

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchChecklist();
      fetchBuddyRelationships();
    }
  }, [status, session, fetchChecklist, fetchBuddyRelationships]);

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

      // Skicka uppdatering till servern
      const response = await fetch(`/api/tasks/${taskId}/progress`, {
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

      // Uppdatering lyckades
      toast.success(completed ? 'Uppgift markerad som slutförd' : 'Uppgift markerad som ej slutförd');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Ett fel uppstod när uppgiftsstatusen skulle uppdateras');

      // Återställ UI till tidigare tillstånd genom att hämta data igen
      fetchChecklist();
    }
  };

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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Du är buddy för
            </CardTitle>
            <CardDescription>
              {buddyRelationships.stats.totalAll > 0
                ? `Du ansvarar för ${buddyRelationships.stats.totalAll} personer (${buddyRelationships.stats.totalActiveUsers} anställda, ${buddyRelationships.stats.totalActivePreparations} förberedelser)`
                : "Du är inte buddy för någon just nu"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {buddyRelationships.stats.totalAll > 0 ? (
              <div className="space-y-6">
                {/* Active Users */}
                {buddyRelationships.activeUsers.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Anställda ({buddyRelationships.activeUsers.length})
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {buddyRelationships.activeUsers.map((user) => (
                        <div key={user.id} className="border rounded-lg p-3 bg-green-50 border-green-200">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Startade: {new Date(user.createdAt).toLocaleDateString('sv-SE')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Preparations */}
                {buddyRelationships.activePreparations.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Förberedelser ({buddyRelationships.activePreparations.length})
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {buddyRelationships.activePreparations.map((prep) => (
                        <div key={prep.id} className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                          <div className="font-medium">{prep.firstName} {prep.lastName}</div>
                          {prep.email && (
                            <div className="text-sm text-muted-foreground">{prep.email}</div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-blue-600 text-white text-xs">
                              Väntar på registrering
                            </Badge>
                          </div>
                          {prep.notes && (
                            <div className="text-xs text-muted-foreground mt-2">
                              📝 {prep.notes}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            Förberedd: {new Date(prep.createdAt).toLocaleDateString('sv-SE')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Preparations */}
                {buddyRelationships.completedPreparations.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-gray-600" />
                      Tidigare förberedelser ({buddyRelationships.completedPreparations.length})
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {buddyRelationships.completedPreparations.slice(0, 6).map((prep) => (
                        <div key={prep.id} className="border rounded-lg p-3 bg-gray-50 border-gray-200">
                          <div className="font-medium">{prep.firstName} {prep.lastName}</div>
                          {prep.user && (
                            <>
                              <div className="text-sm text-muted-foreground">{prep.user.email}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {prep.user.role}
                                </Badge>
                                <Badge className="bg-green-600 text-white text-xs">
                                  Kopplad
                                </Badge>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    {buddyRelationships.completedPreparations.length > 6 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        ... och {buddyRelationships.completedPreparations.length - 6} till
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Du är inte buddy för någon just nu</p>
                <p className="text-sm">Kontakta din admin för att få tilldelad en buddy-roll</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <Card className="w-full md:w-64 lg:w-80">
          <CardHeader className="pb-2">
                            <CardTitle>{t('buddy_progress')}</CardTitle>
                <CardDescription>
                  {t('completed_buddy_tasks_desc', { progress: progress.toString() })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-4" />

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t('completed_buddy_tasks')}</span>
                <Badge variant="outline" className="bg-secondary/10">
                  {checklist.categories.flatMap(c => c.tasks).filter(t => t.completed).length} {t('of')} {checklist.categories.flatMap(c => c.tasks).length}
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
                        <div key={task.id} className="flex items-start gap-3 border rounded-md p-3 bg-card">
                          <Checkbox
                            id={task.id}
                            checked={task.completed}
                            onCheckedChange={(checked) => handleTaskChange(task.id, checked as boolean)}
                            className="mt-1"
                          />
                          <div className="grid gap-1">
                            <label
                              htmlFor={task.id}
                              className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              <div className="flex items-center gap-2">
                                {task.title}
                                <Badge className="bg-secondary text-secondary-foreground">
                                  Buddy
                                </Badge>
                              </div>
                            </label>
                            <p className="text-sm text-muted-foreground">
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