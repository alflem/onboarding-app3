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
import { Info, Users, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string | null;
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

export default function BuddyChecklistPage() {
  const { data: session, status } = useSession({ required: true });
  const [checklist, setChecklist] = useState<ChecklistData>({ categories: [] });
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
        categories: data.categories.map(category => ({
          ...category,
          tasks: category.tasks.filter(task => task.isBuddyTask)
        })).filter(category => category.tasks.length > 0)
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

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchChecklist();
    }
  }, [status, session, fetchChecklist]);

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
        <h1 className="text-3xl font-bold">Buddy Checklista</h1>
        <p className="text-muted-foreground">
          Uppgifter att slutföra för din buddy.
        </p>
      </section>

      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <Card className="w-full md:w-64 lg:w-80">
          <CardHeader className="pb-2">
            <CardTitle>Din buddy-progress</CardTitle>
            <CardDescription>
              Du har slutfört {progress}% av buddy-uppgifterna
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-4" />

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Slutförda buddy-uppgifter</span>
                <Badge variant="outline" className="bg-secondary/10">
                  {checklist.categories.flatMap(c => c.tasks).filter(t => t.completed).length} av {checklist.categories.flatMap(c => c.tasks).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="w-full space-y-4">
          {checklist.categories.length > 0 ? (
            <Accordion type="multiple" defaultValue={["cat1"]} className="w-full">
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
              <p className="text-muted-foreground">Inga buddy-uppgifter hittades.</p>
            </div>
          )}
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