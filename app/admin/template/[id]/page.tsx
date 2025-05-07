"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
  Trash2,
  Edit,
  Plus,
  GripVertical,
  ArrowLeft,
  Save,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// DND Kit-imports
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";



// Typdefinitioner
type Task = {
  id: string;
  title: string;
  description: string;
  order: number;
  isBuddyTask: boolean;
};

type Category = {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
};

type Template = {
  id: string;
  name: string;
  organizationId: string;
  categories: Category[];
};

// Sortable Category Component
function SortableCategory({
  category,
  editingCategoryId,
  editingCategory,
  setEditingCategoryId,
  setEditingCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  setEditingTaskId,
  setEditingTask,
  handleDeleteTask,
  newTask,
  setNewTask,
  handleAddTask,
  saving,
}: {
  category: Category;
  editingCategoryId: string | null;
  editingCategory: { id: string; name: string };
  setEditingCategoryId: (id: string | null) => void;
  setEditingCategory: (category: { id: string; name: string }) => void;
  handleUpdateCategory: () => Promise<void>;
  handleDeleteCategory: (id: string) => Promise<void>;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  setEditingTask: (task: {
    id: string;
    title: string;
    description: string;
    isBuddyTask: boolean;
  }) => void;
  handleDeleteTask: (categoryId: string, taskId: string) => Promise<void>;
  newTask: {
    title: string;
    description: string;
    isBuddyTask: boolean;
    categoryId: string;
  };
  setNewTask: (task: {
    title: string;
    description: string;
    isBuddyTask: boolean;
    categoryId: string;
  }) => void;
  handleAddTask: () => Promise<void>;
  saving: boolean;
}) {


  // Hämta sortable-props för kategorin
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };



  // Skapa en sorterad lista av uppgifts-IDs för SortableContext
  const taskIds = useMemo(
    () => category.tasks.map((task) => task.id),
    [category.tasks]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 ${isDragging ? "border-primary" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          {editingCategoryId === category.id ? (
            <div className="flex items-center space-x-2">
              <Input
                value={editingCategory.name}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    name: e.target.value,
                  })
                }
                className="w-48"
              />
              <Button
                size="sm"
                onClick={handleUpdateCategory}
                disabled={saving}
              >
                Spara
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingCategoryId(null)}
              >
                Avbryt
              </Button>
            </div>
          ) : (
            <h3 className="text-lg font-semibold">{category.name}</h3>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditingCategoryId(category.id);
              setEditingCategory({
                id: category.id,
                name: category.name,
              });
            }}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Redigera</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="sr-only">Ta bort</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta tar bort kategorin och alla uppgifter inom den. Denna
                  åtgärd kan inte ångras.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteCategory(category.id)}
                  className="bg-destructive text-destructive-foreground"
                >
                  Ta bort
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Uppgifter inom kategorin */}
      <div className="space-y-2 ml-6 mt-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {category.tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              categoryId={category.id}
              setEditingTaskId={setEditingTaskId}
              setEditingTask={setEditingTask}
              handleDeleteTask={handleDeleteTask}
            />
          ))}
        </SortableContext>

        {/* Lägg till uppgift i denna kategori */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full mt-2 border-dashed"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till uppgift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till uppgift</DialogTitle>
              <DialogDescription>
                Skapa en ny uppgift i kategorin {category.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="task-title">Titel</Label>
                <Input
                  id="task-title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      title: e.target.value,
                      categoryId: category.id,
                    })
                  }
                  placeholder="Ange uppgiftens titel"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-description">Beskrivning</Label>
                <Textarea
                  id="task-description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      description: e.target.value,
                      categoryId: category.id,
                    })
                  }
                  placeholder="Ange en beskrivning (valfritt)"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="buddy-task"
                  checked={newTask.isBuddyTask}
                  onCheckedChange={(checked) =>
                    setNewTask({
                      ...newTask,
                      isBuddyTask: !!checked,
                      categoryId: category.id,
                    })
                  }
                />
                <Label
                  htmlFor="buddy-task"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Detta är en buddy-uppgift
                </Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Avbryt</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  handleAddTask();
                  const closeButton = document.querySelector(
                    '[data-state="open"] button[aria-label="Close"]'
                  ) as HTMLButtonElement;
                  closeButton?.click();
                }}
                disabled={!newTask.title.trim() || saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Lägg till
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Sortable Task Component
function SortableTask({
  task,
  categoryId,
  setEditingTaskId,
  setEditingTask,
  handleDeleteTask,
}: {
  task: Task;
  categoryId: string;
  setEditingTaskId: (id: string | null) => void;
  setEditingTask: (task: {
    id: string;
    title: string;
    description: string;
    isBuddyTask: boolean;
  }) => void;
  handleDeleteTask: (categoryId: string, taskId: string) => Promise<void>;
}) {
  // Hämta sortable-props för uppgiften
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', categoryId: categoryId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 120ms ease',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-md p-3 ${isDragging ? 'border-primary bg-accent/5' : 'bg-background'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium">{task.title}</div>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {task.description}
              </p>
            )}
            {task.isBuddyTask && (
              <div className="flex items-center mt-1">
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                  <ClipboardCheck className="h-3 w-3 mr-1" />
                  Buddy-uppgift
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditingTaskId(task.id);
              setEditingTask({
                id: task.id,
                title: task.title,
                description: task.description,
                isBuddyTask: task.isBuddyTask,
              });
            }}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Redigera</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="sr-only">Ta bort</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta tar bort uppgiften. Denna åtgärd kan inte ångras.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteTask(categoryId, task.id)}
                  className="bg-destructive text-destructive-foreground"
                >
                  Ta bort
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

// Huvudkomponenten
export default function TemplateEditPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: session, status } = useSession({ required: true });

  // State för drag-and-drop
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDraggingTask, setIsDraggingTask] = useState(false);
  const [isDragDelayed, setIsDragDelayed] = useState(false);
  const dragDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sensorer för drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Övrig state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategory, setEditingCategory] = useState({ id: "", name: "" });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    isBuddyTask: false,
    categoryId: "",
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState({
    id: "",
    title: "",
    description: "",
    isBuddyTask: false,
  });

  // Skapa en sorterad lista av kategori-IDs för SortableContext
  const categoryIds = useMemo(
    () => template?.categories.map((category) => category.id) || [],
    [template]
  );


  const fetchTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/templates/${id}`);

      if (!response.ok) {
        throw new Error("Kunde inte hämta mall");
      }

      const data = await response.json();
      setTemplate(data);
    } catch (error) {
      console.error("Fel vid hämtning av mall:", error);
      toast.error("Ett fel inträffade", {
        description: "Kunde inte ladda mallen. Försök igen senare.",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === "authenticated" && id) {
      // Kontrollera att användaren är admin
      if (
        session?.user.role !== "ADMIN" &&
        session?.user.role !== "SUPER_ADMIN"
      ) {
        router.push("/");
        return;
      }

      fetchTemplate();
    }
  }, [status, session, router, id, fetchTemplate]);

  // Funktion för att hantera drag-start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);

    // Kolla om vi drar en kategori
    const draggedCategory = template?.categories.find(
      (cat) => cat.id === active.id
    );
    if (draggedCategory) {
      setActiveCategory(draggedCategory);
      setIsDraggingTask(false);
      return;
    }

    // Kolla om vi drar en uppgift (task)
    for (const category of template?.categories || []) {
      const draggedTask = category.tasks.find((task) => task.id === active.id);
      if (draggedTask) {
        setActiveTask(draggedTask);
        setIsDraggingTask(true);
        return;
      }
    }
  };

  // Funktion för att hantera drag-end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (dragDelayTimeoutRef.current) {
      clearTimeout(dragDelayTimeoutRef.current);
      dragDelayTimeoutRef.current = null;
    }
    setIsDragDelayed(false);

    setActiveId(null);
    setActiveCategory(null);
    setActiveTask(null);
    setIsDraggingTask(false);

    if (!over || !template) return;

    // Om aktivt och över-element är samma, gör ingenting
    if (active.id === over.id) return;

    // Om vi drar en kategori
    if (!isDraggingTask) {
      const oldIndex = template.categories.findIndex(
        (cat) => cat.id === active.id
      );
      const newIndex = template.categories.findIndex(
        (cat) => cat.id === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const updatedCategories = arrayMove(
          template.categories,
          oldIndex,
          newIndex
        ).map((cat, index) => ({
          ...cat,
          order: index,
        }));

        setTemplate({
          ...template,
          categories: updatedCategories,
        });

        // Spara ändringarna till databasen
        handleSaveCategoryOrder(updatedCategories);
      }
    }
    // Om vi drar en uppgift inom samma kategori
    else {
      const sourceCategory = template.categories.find((cat) =>
        cat.tasks.some((task) => task.id === active.id)
      );

      const targetCategory = template.categories.find((cat) =>
        cat.tasks.some((task) => task.id === over.id)
      );

      if (sourceCategory && targetCategory) {
        // Om vi drar inom samma kategori
        if (sourceCategory.id === targetCategory.id) {
          const oldIndex = sourceCategory.tasks.findIndex(
            (task) => task.id === active.id
          );
          const newIndex = sourceCategory.tasks.findIndex(
            (task) => task.id === over.id
          );

          const reorderedTasks = arrayMove(
            sourceCategory.tasks,
            oldIndex,
            newIndex
          ).map((task, index) => ({
            ...task,
            order: index,
          }));

          const updatedCategories = template.categories.map((cat) =>
            cat.id === sourceCategory.id
              ? { ...cat, tasks: reorderedTasks }
              : cat
          );

          setTemplate({
            ...template,
            categories: updatedCategories,
          });

          // Spara ändringarna till databasen
          handleSaveTaskOrder(reorderedTasks);
        }
      }
    }
  };

  // Funktion för att hantera uppgift som dras över en annan kategori
  const handleDragOver = (event: DragOverEvent) => {
    if (!isDraggingTask || !template || isDragDelayed) return;

    const { active, over } = event;
    if (!over) return;

    setIsDragDelayed(true);
    dragDelayTimeoutRef.current = setTimeout(() => {
      setIsDragDelayed(false);
    }, 100);


    const activeData = active.data.current;
    if (!activeData || active.id === over.id) return;

    // Hitta källkategori för uppgiften som dras
    let sourceCategory: Category | undefined;
    let draggedTask: Task | undefined;

    for (const category of template.categories) {
      const task = category.tasks.find((t) => t.id === active.id);
      if (task) {
        sourceCategory = category;
        draggedTask = task;
        break;
      }
    }

    if (!sourceCategory || !draggedTask) return;

    // Hitta målkategorin (kan vara samma eller annan kategori)
    let targetCategory: Category | undefined;
    let targetIndex = -1;

    // Kontrollera om över-elementet är en kategori
    targetCategory = template.categories.find((cat) => cat.id === over.id);
    if (targetCategory) {
      // Drar till en tom kategori eller slutet av en kategori
      targetIndex = targetCategory.tasks.length;
    } else {
      // Kontrollera om över-elementet är en uppgift
      for (const category of template.categories) {
        const taskIndex = category.tasks.findIndex((t) => t.id === over.id);
        if (taskIndex !== -1) {
          targetCategory = category;
          targetIndex = taskIndex;
          break;
        }
      }
    }

    if (!targetCategory) return;

    // Om vi redan har dragit till samma ställe, gör ingenting
    if (
      sourceCategory.id === targetCategory.id &&
      sourceCategory.tasks.findIndex((t) => t.id === draggedTask?.id) ===
        targetIndex
    ) {
      return;
    }

    // Om vi drar till en annan kategori eller en annan position i samma kategori
    const sourceTasks = [...sourceCategory.tasks];
    const sourceIndex = sourceTasks.findIndex((t) => t.id === draggedTask.id);

    // Ta bort uppgiften från källkategorin
    sourceTasks.splice(sourceIndex, 1);

    // Förbered uppgiften för dess nya kategori
    const taskToMove = {
      ...draggedTask,
      categoryId: targetCategory.id,
    };

    // Lägg till uppgiften i målkategorin
    const targetTasks = [...targetCategory.tasks];
    targetTasks.splice(targetIndex, 0, taskToMove);

    // Uppdatera order för både käll- och målkategori
    const updatedSourceTasks = sourceTasks.map((task, index) => ({
      ...task,
      order: index,
    }));

    const updatedTargetTasks = targetTasks.map((task, index) => ({
      ...task,
      order: index,
    }));


    // Uppdatera mall
    setTemplate({
      ...template,
      categories: template.categories.map((cat) => {
        if (cat.id === sourceCategory?.id) {
          return { ...cat, tasks: updatedSourceTasks };
        }
        if (cat.id === targetCategory?.id) {
          return { ...cat, tasks: updatedTargetTasks };
        }
        return cat;
      }),
    });

    // Spara ändringar till databasen
    handleMoveTask(
      taskToMove,
      targetCategory.id,
      targetIndex,
      updatedSourceTasks,
      updatedTargetTasks
    );
  };

  // Funktion för att spara kategoriordning till databasen
  const handleSaveCategoryOrder = async (categories: Category[]) => {
    setSaving(true);
    try {
      const updates = categories.map((cat) => ({
        id: cat.id,
        order: cat.order,
      }));

      const response = await fetch("/api/categories/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categories: updates }),
      });

      if (!response.ok) {
        throw new Error("Kunde inte uppdatera ordningen");
      }
    } catch (error) {
      console.error("Fel vid omsortering av kategorier:", error);
      toast.error("Ett fel inträffade", {
        description: "Kunde inte spara den nya ordningen. Försök igen senare.",
      });
      // Återställ till tidigare tillstånd vid fel genom att hämta mallen igen
      fetchTemplate();
    } finally {
      setSaving(false);
    }
  };

  // Funktion för att spara uppgiftsordning till databasen
  const handleSaveTaskOrder = async (tasks: Task[]) => {
    setSaving(true);
    try {
      const updates = tasks.map((task) => ({
        id: task.id,
        order: task.order,
      }));

      const response = await fetch("/api/tasks/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tasks: updates }),
      });

      if (!response.ok) {
        throw new Error("Kunde inte uppdatera ordningen");
      }
    } catch (error) {
      console.error("Fel vid omsortering av uppgifter:", error);
      toast.error("Ett fel inträffade", {
        description: "Kunde inte spara den nya ordningen. Försök igen senare.",
      });
      // Återställ till tidigare tillstånd vid fel genom att hämta mallen igen
      fetchTemplate();
    } finally {
      setSaving(false);
    }
  };

  // Funktion för att hantera flyttning av uppgift mellan kategorier
  const handleMoveTask = async (
    task: Task,
    newCategoryId: string,
    newOrder: number,
    updatedSourceTasks: Task[],
    updatedTargetTasks: Task[]
  ) => {
    setSaving(true);
    try {
      // Uppdatera uppgiften med ny kategori och ordning
      const moveResponse = await fetch(`/api/tasks/${task.id}/move`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: newCategoryId,
          order: newOrder,
        }),
      });

      if (!moveResponse.ok) {
        throw new Error("Kunde inte flytta uppgiften");
      }

      // Uppdatera ordningen för uppgifter i källkategorin om det finns några
      if (updatedSourceTasks.length > 0) {
        const sourceUpdates = updatedSourceTasks.map((task) => ({
          id: task.id,
          order: task.order,
        }));

        const sourceResponse = await fetch("/api/tasks/reorder", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tasks: sourceUpdates }),
        });

        if (!sourceResponse.ok) {
          throw new Error("Kunde inte uppdatera källordningen");
        }
      }

      // Uppdatera ordningen för uppgifter i målkategorin
      const destUpdates = updatedTargetTasks.map((task) => ({
        id: task.id,
        order: task.order,
      }));

      const destResponse = await fetch("/api/tasks/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tasks: destUpdates }),
      });

      if (!destResponse.ok) {
        throw new Error("Kunde inte uppdatera målordningen");
      }
    } catch (error) {
      console.error("Fel vid flyttning av uppgift mellan kategorier:", error);
      toast.error("Ett fel inträffade", {
        description: "Kunde inte flytta uppgiften. Försök igen senare.",
      });
      // Återställ till tidigare tillstånd vid fel genom att hämta mallen igen
      fetchTemplate();
    } finally {
      setSaving(false);
    }
  };

  // Funktioner för att hantera kategorier
  const handleAddCategory = async () => {
    if (newCategory.name.trim() && template) {
      setSaving(true);

      try {
        const newCategoryObj = {
          name: newCategory.name,
          order: template.categories.length,
          templateId: template.id,
        };

        const response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCategoryObj),
        });

        if (!response.ok) {
          throw new Error("Kunde inte skapa kategori");
        }

        const addedCategory = await response.json();

        setTemplate({
          ...template,
          categories: [...template.categories, { ...addedCategory, tasks: [] }],
        });

        setNewCategory({ name: "" });

        toast.success("Kategori skapad", {
          description: "Kategorin har lagts till i mallen.",
        });
      } catch (error) {
        console.error("Fel vid skapande av kategori:", error);
        toast.error("Ett fel inträffade", {
          description: "Kunde inte skapa kategorin. Försök igen senare.",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleUpdateCategory = async () => {
    if (editingCategory.name.trim() && editingCategoryId && template) {
      setSaving(true);

      try {
        const response = await fetch(`/api/categories/${editingCategoryId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: editingCategory.name }),
        });

        if (!response.ok) {
          throw new Error("Kunde inte uppdatera kategori");
        }

        const updatedCategory = await response.json();

        setTemplate({
          ...template,
          categories: template.categories.map((cat) =>
            cat.id === editingCategoryId
              ? { ...cat, name: updatedCategory.name }
              : cat
          ),
        });

        setEditingCategoryId(null);

        toast.success("Kategori uppdaterad", {
          description: "Kategorin har uppdaterats i mallen.",
        });
      } catch (error) {
        console.error("Fel vid uppdatering av kategori:", error);
        toast.error("Ett fel inträffade", {
          description: "Kunde inte uppdatera kategorin. Försök igen senare.",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (template) {
      setSaving(true);

      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Kunde inte ta bort kategori");
        }

        setTemplate({
          ...template,
          categories: template.categories.filter(
            (cat) => cat.id !== categoryId
          ),
        });

        toast.success("Kategori borttagen", {
          description: "Kategorin har tagits bort från mallen.",
        });
      } catch (error) {
        console.error("Fel vid borttagning av kategori:", error);
        toast.error("Ett fel inträffade", {
          description: "Kunde inte ta bort kategorin. Försök igen senare.",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // Funktioner för att hantera uppgifter
  const handleAddTask = async () => {
    if (newTask.title.trim() && newTask.categoryId && template) {
      setSaving(true);

      try {
        const category = template.categories.find(
          (cat) => cat.id === newTask.categoryId
        );

        if (!category) {
          throw new Error("Kategori hittades inte");
        }

        const newTaskObj = {
          title: newTask.title,
          description: newTask.description,
          isBuddyTask: newTask.isBuddyTask,
          order: category.tasks.length,
          categoryId: newTask.categoryId,
        };

        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTaskObj),
        });

        if (!response.ok) {
          throw new Error("Kunde inte skapa uppgift");
        }

        const addedTask = await response.json();

        setTemplate({
          ...template,
          categories: template.categories.map((cat) =>
            cat.id === newTask.categoryId
              ? { ...cat, tasks: [...cat.tasks, addedTask] }
              : cat
          ),
        });

        setNewTask({
          title: "",
          description: "",
          isBuddyTask: false,
          categoryId: "",
        });

        toast.success("Uppgift skapad", {
          description: "Uppgiften har lagts till i mallen.",
        });
      } catch (error) {
        console.error("Fel vid skapande av uppgift:", error);
        toast.error("Ett fel inträffade", {
          description: "Kunde inte skapa uppgiften. Försök igen senare.",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleUpdateTask = async () => {
    if (editingTask.title.trim() && editingTaskId && template) {
      setSaving(true);

      try {
        const updateData = {
          title: editingTask.title,
          description: editingTask.description,
          isBuddyTask: editingTask.isBuddyTask,
        };

        const response = await fetch(`/api/tasks/${editingTaskId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          throw new Error("Kunde inte uppdatera uppgift");
        }

        const updatedTask = await response.json();

        setTemplate({
          ...template,
          categories: template.categories.map((cat) => ({
            ...cat,
            tasks: cat.tasks.map((task) =>
              task.id === editingTaskId
                ? {
                    ...task,
                    title: updatedTask.title,
                    description: updatedTask.description,
                    isBuddyTask: updatedTask.isBuddyTask,
                  }
                : task
            ),
          })),
        });

        setEditingTaskId(null);

        toast.success("Uppgift uppdaterad", {
          description: "Uppgiften har uppdaterats i mallen.",
        });
      } catch (error) {
        console.error("Fel vid uppdatering av uppgift:", error);
        toast.error("Ett fel inträffade", {
          description: "Kunde inte uppdatera uppgiften. Försök igen senare.",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteTask = async (categoryId: string, taskId: string) => {
    if (template) {
      setSaving(true);

      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Kunde inte ta bort uppgift");
        }

        setTemplate({
          ...template,
          categories: template.categories.map((cat) =>
            cat.id === categoryId
              ? {
                  ...cat,
                  tasks: cat.tasks.filter((task) => task.id !== taskId),
                }
              : cat
          ),
        });

        toast.success("Uppgift borttagen", {
          description: "Uppgiften har tagits bort från mallen.",
        });
      } catch (error) {
        console.error("Fel vid borttagning av uppgift:", error);
        toast.error("Ett fel inträffade", {
          description: "Kunde inte ta bort uppgiften. Försök igen senare.",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // Funktion för att spara mallen
  const handleSaveTemplate = async () => {
    if (template) {
      setSaving(true);

      try {
        const response = await fetch(`/api/templates/${template.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: template.name }),
        });

        if (!response.ok) {
          throw new Error("Kunde inte spara mallen");
        }

        toast.success("Mall sparad", {
          description: "Mallen har sparats framgångsrikt.",
        });
      } catch (error) {
        console.error("Fel vid sparande av mall:", error);
        toast.error("Ett fel inträffade", {
          description: "Kunde inte spara mallen. Försök igen senare.",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // Funktion för att ta bort mallen
  const handleDeleteTemplate = async () => {
    if (template) {
      setSaving(true);

      try {
        const response = await fetch(`/api/templates/${template.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Kunde inte ta bort mallen");
        }

        toast.success("Mall borttagen", {
          description: "Mallen har tagits bort framgångsrikt.",
        });

        router.push("/admin");
      } catch (error) {
        console.error("Fel vid borttagning av mall:", error);
        toast.error("Ett fel inträffade", {
          description: "Kunde inte ta bort mallen. Försök igen senare.",
        });
        setSaving(false);
      }
    }
  };

  // Render-logik för laddningsstatus
  if (status === "loading" || loading) {
    return (
      <div className="container p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Laddar mall...</p>
      </div>
    );
  }

  // Render-logik om mallen inte kunde hittas
  if (!template) {
    return (
      <div className="container p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-xl font-semibold mb-2">Mallen kunde inte hittas</p>
        <p className="text-muted-foreground mb-4">
          Mallen du letar efter finns inte eller så har du inte behörighet att
          se den.
        </p>
        <Button onClick={() => router.push("/admin")}>
          Tillbaka till adminpanelen
        </Button>
      </div>
    );
  }

  // Huvudrenderingen av mallen
  return (
    <div className="container p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Tillbaka
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <p className="text-muted-foreground">
              Redigera mall och checklista
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleSaveTemplate}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Spara
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Ta bort mall
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                <AlertDialogDescription>
                  Denna åtgärd kan inte ångras. Detta kommer permanent ta bort
                  mallen och alla dess kategorier och uppgifter.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTemplate}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Ta bort
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Mallinställningar */}
      <Card>
        <CardHeader>
          <CardTitle>Mallinställningar</CardTitle>
          <CardDescription>
            Anpassa grundinställningar för mallen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name">Mallnamn</Label>
              <Input
                id="template-name"
                value={template?.name || ""}
                onChange={(e) =>
                  setTemplate({ ...template, name: e.target.value })
                }
                placeholder="Ange ett namn för mallen"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kategorier och uppgifter */}
      <Card>
        <CardHeader>
          <CardTitle>Checklista och uppgifter</CardTitle>
          <CardDescription>
            Hantera kategorier och uppgifter i checklistan. Dra och släpp för
            att ändra ordning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
          >
            <SortableContext
              items={categoryIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {template.categories.map((category) => (
                  <SortableCategory
                    key={category.id}
                    category={category}
                    editingCategoryId={editingCategoryId}
                    editingCategory={editingCategory}
                    setEditingCategoryId={setEditingCategoryId}
                    setEditingCategory={setEditingCategory}
                    handleUpdateCategory={handleUpdateCategory}
                    handleDeleteCategory={handleDeleteCategory}
                    editingTaskId={editingTaskId}
                    setEditingTaskId={setEditingTaskId}
                    setEditingTask={setEditingTask}
                    handleDeleteTask={handleDeleteTask}
                    newTask={newTask}
                    setNewTask={setNewTask}
                    handleAddTask={handleAddTask}
                    saving={saving}
                  />
                ))}
              </div>
            </SortableContext>
            {/* Overlay som visar vad som dras */}
            <DragOverlay
              adjustScale={false}
              zIndex={1000}
              dropAnimation={{
                duration: 250,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)", // Mjukare, lätt studsa-effekt
              }}
            >
              {activeId && activeCategory && !isDraggingTask ? (
                // Visa kategori om en kategori dras
                <div className="border rounded-lg p-4 bg-background shadow-lg opacity-90">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">
                      {activeCategory.name}
                    </h3>
                  </div>
                </div>
              ) : activeId && activeTask ? (
                // Visa uppgift om en uppgift dras
                <div className="border rounded-md p-3 bg-background shadow-lg opacity-90">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{activeTask.title}</div>
                      {activeTask.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {activeTask.description}
                        </p>
                      )}
                      {activeTask.isBuddyTask && (
                        <div className="flex items-center mt-1">
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                            <ClipboardCheck className="h-3 w-3 mr-1" />
                            Buddy-uppgift
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Lägg till ny kategori */}
          <div className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Lägg till ny kategori
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Kategorinamn"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ name: e.target.value })}
                  />
                  <Button
                    onClick={handleAddCategory}
                    disabled={!newCategory.name.trim() || saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Lägg till
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Dialog för redigering av uppgift */}
      {editingTaskId && (
        <Dialog
          open={!!editingTaskId}
          onOpenChange={(open) => !open && setEditingTaskId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redigera uppgift</DialogTitle>
              <DialogDescription>Gör ändringar i uppgiften.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-task-title">Titel</Label>
                <Input
                  id="edit-task-title"
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      title: e.target.value,
                    })
                  }
                  placeholder="Ange uppgiftens titel"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-task-description">Beskrivning</Label>
                <Textarea
                  id="edit-task-description"
                  value={editingTask.description}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      description: e.target.value,
                    })
                  }
                  placeholder="Ange en beskrivning (valfritt)"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-buddy-task"
                  checked={editingTask.isBuddyTask}
                  onCheckedChange={(checked) =>
                    setEditingTask({
                      ...editingTask,
                      isBuddyTask: !!checked,
                    })
                  }
                />
                <Label
                  htmlFor="edit-buddy-task"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Detta är en buddy-uppgift
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTaskId(null)}>
                Avbryt
              </Button>
              <Button
                onClick={handleUpdateTask}
                disabled={!editingTask.title.trim() || saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Spara
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
