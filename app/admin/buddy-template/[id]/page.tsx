"use client";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  RotateCcw,
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
  link: string | null;
  order: number;
  isBuddyTask: boolean;
};

type Category = {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
};

type Checklist = {
  id: string;
  name?: string; // Name is from the organization
  organizationId: string;
  categories: Category[];
  organization: {
    name: string;
  };
};

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
    link: string;
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
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 120ms ease",
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-md p-3 ${
        isDragging ? "border-primary bg-accent/5" : "bg-background"
      }`}
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
                link: task.link || "",
                isBuddyTask: true, // Always true for buddy tasks
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

// Sortable Category Component with Buddy Tasks
function SortableBuddyCategory({
  category,
  editingCategoryId,
  editingCategory,
  setEditingCategoryId,
  setEditingCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  _editingTaskId,
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
  _editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  setEditingTask: (task: {
    id: string;
    title: string;
    description: string;
    link: string;
    isBuddyTask: boolean;
  }) => void;
  handleDeleteTask: (categoryId: string, taskId: string) => Promise<void>;
  newTask: {
    title: string;
    description: string;
    link: string;
    isBuddyTask: boolean;
    categoryId: string;
  };
  setNewTask: (task: {
    title: string;
    description: string;
    link: string;
    isBuddyTask: boolean;
    categoryId: string;
  }) => void;
  handleAddTask: () => Promise<void>;
  saving: boolean;
}) {
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

  // Filtered buddy tasks
  const buddyTasks = category.tasks.filter((task) => task.isBuddyTask);

  // Skapa en sorterad lista av uppgifts-IDs för SortableContext
  const taskIds = useMemo(
    () => buddyTasks.map((task) => task.id),
    [buddyTasks]
  );

  if (buddyTasks.length === 0 && category.tasks.length > 0) {
    return null; // Don't render categories with tasks but no buddy tasks
  }

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
            <h3 className="text-lg font-medium">{category.name}</h3>
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
                  Detta tar bort kategorin och alla buddyuppgifter inom den.
                  Denna åtgärd kan inte ångras.
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

      <div className="space-y-3 ml-6 mt-2">
        {buddyTasks.length > 0 ? (
          <SortableContext
            items={taskIds}
            strategy={verticalListSortingStrategy}
          >
            {buddyTasks
              .sort((a, b) => a.order - b.order)
              .map((task) => (
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
        ) : (
          <p className="text-center py-4 text-muted-foreground">
            Inga buddyuppgifter i denna kategori ännu. Lägg till en!
          </p>
        )}

        {/* Lägg till uppgift i denna kategori */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full mt-2 border-dashed"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till buddyuppgift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till buddyuppgift</DialogTitle>
              <DialogDescription>
                Lägg till en ny uppgift som ska genomföras av en buddy i kategorin {category.name}.
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
                      isBuddyTask: true, // Always true for buddy tasks
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
                      isBuddyTask: true, // Always true for buddy tasks
                    })
                  }
                  placeholder="Ange en beskrivning (valfritt)"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-link">Länk (valfritt)</Label>
                <Input
                  id="task-link"
                  value={newTask.link}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      link: e.target.value,
                      categoryId: category.id,
                      isBuddyTask: true, // Always true for buddy tasks
                    })
                  }
                  placeholder="https://exempel.se"
                  type="url"
                />
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

// Huvudkomponenten
export default function BuddyTemplatePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: session } = useSession({ required: true });

  // State for drag-and-drop
  const [draggedId, setDraggedId] = useState<UniqueIdentifier | null>(null);

  // State for template editing
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<Checklist | null>(null);

  // State for category editing
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategory, setEditingCategory] = useState({ id: "", name: "" });

  // State for task editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState({
    id: "",
    title: "",
    description: "",
    link: "",
    isBuddyTask: true, // Always true for buddy tasks
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    link: "",
    isBuddyTask: true, // Always true for buddy tasks
    categoryId: "",
  });

  // Initiera drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Hämta checklista vid start
  useEffect(() => {
    const fetchChecklist = async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/templates/${id}`);

        if (!response.ok) {
          throw new Error("Kunde inte hämta mallen");
        }

        const data = await response.json();
        setChecklist(data);
      } catch (error) {
        console.error("Fel vid hämtning av mall:", error);
        toast.error("Kunde inte ladda mallen", {
          description: "Ett fel uppstod vid hämtning av mallen.",
        });
        router.push("/admin");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchChecklist();
    }
  }, [id, router, session?.user?.id]);

  // Hantera drag av uppgifter
  const handleDragStart = (event: DragStartEvent) => {
    setDraggedId(event.active.id);
  };

  // Hantera slut på drag
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      if (checklist) {
        // Find what type of item is being dragged (category or task)
        const isCategoryDrag = checklist.categories.some(
          (cat) => cat.id === active.id
        );

        if (isCategoryDrag) {
          // Reordering categories
          const oldIndex = checklist.categories.findIndex(
            (cat) => cat.id === active.id
          );
          const newIndex = checklist.categories.findIndex(
            (cat) => cat.id === over.id
          );

          const reorderedCategories = arrayMove(
            checklist.categories,
            oldIndex,
            newIndex
          ).map((cat, index) => ({ ...cat, order: index }));

          setChecklist({
            ...checklist,
            categories: reorderedCategories,
          });

          // Save the new category order
          await handleSaveCategoryOrder(reorderedCategories);
        } else {
          // Find which category the task belongs to
          let sourceCategory: Category | undefined;
          let task: Task | undefined;

          for (const category of checklist.categories) {
            const foundTask = category.tasks.find((t) => t.id === active.id);
            if (foundTask) {
              sourceCategory = category;
              task = foundTask;
              break;
            }
          }

          if (sourceCategory && task) {
            // Find which category the task is being dragged to
            const isSameCategory = sourceCategory.tasks.some(
              (t) => t.id === over.id
            );

            if (isSameCategory) {
              // Reorder within the same category
              const oldIndex = sourceCategory.tasks.findIndex(
                (t) => t.id === active.id
              );
              const newIndex = sourceCategory.tasks.findIndex(
                (t) => t.id === over.id
              );

              const reorderedTasks = arrayMove(
                sourceCategory.tasks,
                oldIndex,
                newIndex
              ).map((t, index) => ({ ...t, order: index }));

              // Update the checklist state
              setChecklist({
                ...checklist,
                categories: checklist.categories.map((cat) =>
                  cat.id === sourceCategory?.id
                    ? { ...cat, tasks: reorderedTasks }
                    : cat
                ),
              });

              // Save the new task order
              await handleSaveTaskOrder(reorderedTasks);
            }
          }
        }
      }
    }

    setDraggedId(null);
  };

  // Save category order
  const handleSaveCategoryOrder = async (categories: Category[]) => {
    setSaving(true);

    try {
      const response = await fetch(`/api/categories/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categories: categories.map((cat) => ({
            id: cat.id,
            order: cat.order,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Kunde inte spara kategoriordning");
      }

      toast.success("Ordning uppdaterad", {
        description: "Kategoriordningen har sparats.",
      });
    } catch (error) {
      console.error("Fel vid sparande av kategoriordning:", error);
      toast.error("Kunde inte spara ordning", {
        description: "Ett fel uppstod vid sparande av kategoriordning.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Save task order
  const handleSaveTaskOrder = async (tasks: Task[]) => {
    setSaving(true);

    try {
      const response = await fetch(`/api/tasks/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks: tasks.map((task) => ({
            id: task.id,
            order: task.order,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Kunde inte spara uppgiftsordning");
      }

      toast.success("Ordning uppdaterad", {
        description: "Uppgiftsordningen har sparats.",
      });
    } catch (error) {
      console.error("Fel vid sparande av uppgiftsordning:", error);
      toast.error("Kunde inte spara ordning", {
        description: "Ett fel uppstod vid sparande av uppgiftsordning.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Add a new category
  const handleAddCategory = async () => {
    if (newCategory.name.trim() && checklist) {
      setSaving(true);

      try {
        const newCategoryObj = {
          name: newCategory.name,
          order: checklist.categories.length,
          checklistId: checklist.id,
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

        setChecklist({
          ...checklist,
          categories: [
            ...checklist.categories,
            { ...addedCategory, tasks: [] },
          ],
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

  // Update an existing category
  const handleUpdateCategory = async () => {
    if (editingCategory.name.trim() && editingCategoryId && checklist) {
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

        setChecklist({
          ...checklist,
          categories: checklist.categories.map((cat) =>
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

  // Delete a category
  const handleDeleteCategory = async (categoryId: string) => {
    if (checklist) {
      setSaving(true);

      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Kunde inte ta bort kategori");
        }

        setChecklist({
          ...checklist,
          categories: checklist.categories.filter(
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

  // Add a new task
  const handleAddTask = async () => {
    if (newTask.title.trim() && newTask.categoryId && checklist) {
      setSaving(true);

      try {
        const category = checklist.categories.find(
          (cat) => cat.id === newTask.categoryId
        );

        if (!category) {
          throw new Error("Kategori hittades inte");
        }

        // Filter buddy tasks
        const buddyTasks = category.tasks.filter((task) => task.isBuddyTask);

        const newTaskObj = {
          title: newTask.title,
          description: newTask.description,
          link: newTask.link || null,
          isBuddyTask: true, // Always true for buddy tasks
          order: buddyTasks.length,
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

        setChecklist({
          ...checklist,
          categories: checklist.categories.map((cat) =>
            cat.id === newTask.categoryId
              ? { ...cat, tasks: [...cat.tasks, addedTask] }
              : cat
          ),
        });

        setNewTask({
          title: "",
          description: "",
          link: "",
          isBuddyTask: true,
          categoryId: "",
        });

        toast.success("Buddyuppgift skapad", {
          description: "Buddyuppgiften har lagts till i mallen.",
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

  // Update an existing task
  const handleUpdateTask = async () => {
    if (editingTask.title.trim() && editingTaskId && checklist) {
      setSaving(true);

      try {
        const updateData = {
          title: editingTask.title,
          description: editingTask.description,
          link: editingTask.link || null,
          isBuddyTask: true, // Always true for buddy tasks
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

        setChecklist({
          ...checklist,
          categories: checklist.categories.map((cat) => ({
            ...cat,
            tasks: cat.tasks.map((task) =>
              task.id === editingTaskId
                ? {
                    ...task,
                    title: updatedTask.title,
                    description: updatedTask.description,
                    link: updatedTask.link,
                    isBuddyTask: true, // Always true for buddy tasks
                  }
                : task
            ),
          })),
        });

        setEditingTaskId(null);

        toast.success("Buddyuppgift uppdaterad", {
          description: "Buddyuppgiften har uppdaterats i mallen.",
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

  // Delete a task
  const handleDeleteTask = async (categoryId: string, taskId: string) => {
    if (checklist) {
      setSaving(true);

      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Kunde inte ta bort uppgift");
        }

        setChecklist({
          ...checklist,
          categories: checklist.categories.map((cat) =>
            cat.id === categoryId
              ? {
                  ...cat,
                  tasks: cat.tasks.filter((task) => task.id !== taskId),
                }
              : cat
          ),
        });

        toast.success("Buddyuppgift borttagen", {
          description: "Buddyuppgiften har tagits bort från mallen.",
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

  // Reset buddy checklist to standard template
  const resetBuddyChecklist = async () => {
    if (!checklist) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/templates/${id}/reset-buddy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Kunde inte återställa buddy-checklista');
      }

      const result = await response.json();

      // Uppdatera checklistan med den nya data
      setChecklist(result.data);

      toast.success("Buddy-checklista återställd", {
        description: "Buddy-checklistan har återställts till standardmallen med svenska processer."
      });
    } catch (error) {
      console.error("Fel vid återställning av buddy-checklista:", error);
      toast.error("Kunde inte återställa buddy-checklista", {
        description: "Ett fel uppstod vid återställning av buddy-checklista."
      });
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Laddar buddyuppgifter...</span>
      </div>
    );
  }

  // Render the template editor
  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Buddy Uppgifter</h1>
            <p className="text-muted-foreground">
              Hantera uppgifter som ska utföras av en buddy
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/template/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Till checklista för nyanställd
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Återställer...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Återställ Buddy-checklista
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Återställ buddy-checklista?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta kommer att ta bort alla befintliga buddyuppgifter och ersätta dem med standardmallen för svenska processer (nyanställningsintroduktion). Vanliga uppgifter påverkas inte. Denna åtgärd kan inte ångras.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={resetBuddyChecklist}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Återställer...
                    </>
                  ) : (
                    "Återställ Buddy-checklista"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {editingTaskId && (
        <Dialog
          open={!!editingTaskId}
          onOpenChange={(open) => !open && setEditingTaskId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redigera buddyuppgift</DialogTitle>
              <DialogDescription>
                Redigera information för denna buddyuppgift.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-task-title">Titel</Label>
                <Input
                  id="edit-task-title"
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
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
              <div className="grid gap-2">
                <Label htmlFor="edit-task-link">Länk (valfritt)</Label>
                <Input
                  id="edit-task-link"
                  value={editingTask.link}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      link: e.target.value,
                    })
                  }
                  placeholder="https://exempel.se"
                  type="url"
                />
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

      <Card>
        <CardHeader>
          <CardTitle>Checklista och uppgifter</CardTitle>
          <CardDescription>
            Hantera uppgifter som ska utföras av buddies. Dra och släpp för
            att ändra ordning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Alla uppgifter på denna sida är buddyuppgifter, vilket innebär
              att de ska utföras av en person som är buddy för en nyanställd.
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
            >
              <div className="space-y-4 mt-6">
                {checklist?.categories.length ? (
                  <SortableContext
                    items={checklist.categories.map((cat) => cat.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {checklist.categories
                      .sort((a, b) => a.order - b.order)
                      .map((category) => (
                        <SortableBuddyCategory
                          key={category.id}
                          category={category}
                          editingCategoryId={editingCategoryId}
                          editingCategory={editingCategory}
                          setEditingCategoryId={setEditingCategoryId}
                          setEditingCategory={setEditingCategory}
                          handleUpdateCategory={handleUpdateCategory}
                          handleDeleteCategory={handleDeleteCategory}
                          _editingTaskId={editingTaskId}
                          setEditingTaskId={setEditingTaskId}
                          setEditingTask={setEditingTask}
                          handleDeleteTask={handleDeleteTask}
                          newTask={newTask}
                          setNewTask={setNewTask}
                          handleAddTask={handleAddTask}
                          saving={saving}
                        />
                      ))}
                  </SortableContext>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <p className="text-muted-foreground">
                      Inga kategorier hittades. Gå till den vanliga
                      checklista-redigeraren för att skapa kategorier.
                    </p>
                  </div>
                )}

                <DragOverlay>
                  {draggedId ? (
                    <div className="border rounded-lg p-4 bg-background shadow-lg">
                      <div className="animate-pulse">Flyttar...</div>
                    </div>
                  ) : null}
                </DragOverlay>
              </div>
            </DndContext>

            {/* Add new category */}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
