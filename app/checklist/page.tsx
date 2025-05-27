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
import Link from "next/link";
import { Info, Users, HelpCircle, Clipboard, ExternalLink } from "lucide-react";
import { toast } from "sonner";

// // Typdeklarationer baserade på Prisma-schemat
// interface Organization {
//   id: string;
//   name: string;
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   organization: Organization;
// }

interface Task {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  isBuddyTask: boolean;
  order: number;
  completed: boolean; // Detta fält läggs till från TaskProgress
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

export default function ChecklistPage() {
  const { data: session, status } = useSession({ required: true });
  const [checklist, setChecklist] = useState<ChecklistData>({ categories: [] });
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [buddyTasksCount, setBuddyTasksCount] = useState(0);
  const [buddyTasksCompleted, setBuddyTasksCompleted] = useState(0);
  const [buddyEnabled, setBuddyEnabled] = useState<boolean | null>(null);

  // Kontrollera om buddy-funktionen är aktiverad
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user/is-buddy')
        .then(response => response.json())
        .then(data => {
          setBuddyEnabled(data.buddyEnabled);
        })
        .catch(error => {
          console.error("Kunde inte kontrollera buddy-status:", error);
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

      // Count buddy tasks only if buddy is enabled
      let buddyTotal = 0;
      let buddyCompleted = 0;
      if (buddyEnabled) {
        data.categories.forEach(category => {
          category.tasks.forEach(task => {
            if (task.isBuddyTask) {
              buddyTotal++;
              if (task.completed) {
                buddyCompleted++;
              }
            }
          });
        });
      }

      setBuddyTasksCount(buddyTotal);
      setBuddyTasksCompleted(buddyCompleted);

      // Filter out buddy tasks from the main checklist
      const filteredData = {
        categories: data.categories.map(category => ({
          ...category,
          tasks: category.tasks.filter(task => !task.isBuddyTask)
        })).filter(category => category.tasks.length > 0)
      };

      setChecklist(filteredData);
      calculateProgress(filteredData.categories);
    } catch (error) {
      console.error('Error fetching checklist:', error);
      toast.error('Ett fel uppstod när checklistan skulle hämtas');
    } finally {
      setIsLoading(false);
    }
  }, [buddyEnabled]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id && buddyEnabled !== null) {
      fetchChecklist();
    }
  }, [status, session, buddyEnabled, fetchChecklist]);

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
    return <div className="container p-8 flex justify-center">Laddar...</div>;
  }

  return (
    <div className="container p-4 md:p-8 space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Din onboarding-checklista</h1>
        <p className="text-muted-foreground">
          Följ dessa steg för en smidig start på ditt nya jobb.
        </p>
      </section>

      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <div className="w-full md:w-64 lg:w-80 space-y-4">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle>Din progress</CardTitle>
              <CardDescription>
                Du har slutfört {progress}% av din checklista
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-4" />

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Slutförda uppgifter</span>
                  <Badge variant="outline" className="bg-primary/10">
                    {checklist.categories.flatMap(c => c.tasks).filter(t => t.completed).length} av {checklist.categories.flatMap(c => c.tasks).length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {buddyEnabled && buddyTasksCount > 0 && (
            <Card className="w-full">
              <CardHeader className="pb-2">
                <CardTitle>Buddy-uppgifter</CardTitle>
                <CardDescription>
                  Uppgifter som ska utföras av din buddy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Status</span>
                    <Badge variant="outline" className="bg-secondary/10">
                      {buddyTasksCompleted} av {buddyTasksCount}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="w-full space-y-4">
          <Accordion type="multiple" defaultValue={["cat1"]} className="w-full">
            {checklist.categories.map((category) => (
              <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-2 mb-4">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="outline" className="ml-2 bg-primary/10">
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
                                Öppna länk
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
        </div>
      </div>

      <Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Info className="h-5 w-5 text-primary" />
      Behöver du hjälp?
    </CardTitle>
  </CardHeader>
  <CardContent className="flex justify-center items-center gap-4">
    <Button
      variant="outline"
      className="flex items-center justify-start gap-2 h-auto py-3 px-6 max-w-md flex-grow"
    >
      <HelpCircle className="h-5 w-5 text-primary" />
      <div className="text-left">
        <div className="font-medium">Support</div>
        <div className="text-xs text-muted-foreground">Kontakta IT-support</div>
      </div>
    </Button>
    <Button
      variant="outline"
      className="flex items-center justify-start gap-2 h-auto py-3 px-6 max-w-md flex-grow"
    >
      <Users className="h-5 w-5 text-primary" />
      <div className="text-left">
        <div className="font-medium">HR-kontakt</div>
        <div className="text-xs text-muted-foreground">Frågor om din anställning</div>
      </div>
    </Button>
  </CardContent>
</Card>
    </div>
  );
}