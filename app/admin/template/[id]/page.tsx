"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  ClipboardCheck,
  Loader2,
  RotateCcw
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
  isBuddyCategory?: boolean;
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

// Sortable Category Component
function SortableCategory({
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

  // Create a local copy to avoid the linter confusion
  const editingTaskIdProp = _editingTaskId;

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
          {category.tasks
            .filter((task) => !task.isBuddyTask)
            .sort((a, b) => a.order - b.order)
            .map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                categoryId={category.id}
                _editingTaskId={editingTaskIdProp}
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
                      isBuddyTask: false,
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
              <DialogClose asChild>
                <Button
                  onClick={async () => {
                    await handleAddTask();
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
              </DialogClose>
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
  _editingTaskId,
  setEditingTaskId,
  setEditingTask,
  handleDeleteTask,
}: {
  task: Task;
  categoryId: string;
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
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
  };

  return (
    <div
      id={`task-${task.id}`}
      data-task-id={task.id}
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
            {task.isBuddyTask && (
              <div className="flex items-center mt-1">
                <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full flex items-center">
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
                link: task.link || "",
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
  const dragDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sensorer för drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
        delay: 0,
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
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [buddyEnabled, setBuddyEnabled] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategory, setEditingCategory] = useState({ id: "", name: "" });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    link: "",
    isBuddyTask: false,
    categoryId: "",
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState({
    id: "",
    title: "",
    description: "",
    link: "",
    isBuddyTask: false,
  });

  // Filtrera kategorier: visa endast vanliga kategorier (inte buddy) och som är tomma eller enbart innehåller icke-buddy-uppgifter
  const regularCategories = useMemo(
    () =>
      checklist?.categories.filter((category) =>
        (category.isBuddyCategory === false || category.isBuddyCategory === undefined) &&
        (category.tasks.length === 0 || category.tasks.every((task) => !task.isBuddyTask))
      ) || [],
    [checklist]
  );

  // Skapa en sorterad lista av kategori-IDs för SortableContext (endast vanliga kategorier)
  const categoryIds = useMemo(
    () => regularCategories.map((category) => category.id) || [],
    [regularCategories]
  );

  const fetchChecklist = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/templates/${id}`);

      if (!response.ok) {
        throw new Error("Kunde inte hämta mall");
      }

      const data = await response.json();

      // Ensure the organization is always present
      if (!data.organization) {
        // If for some reason the organization is missing, create a placeholder
        data.organization = { name: "Onboarding Checklista" };
      }

      setChecklist(data);
    } catch (error) {
      console.error("Fel vid hämtning av mall:", error);
      toast.error("Ett fel inträffade", {
        description: "Kunde inte ladda mallen. Försök igen senare.",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Funktion för att återställa checklistan till standardmall
  const resetChecklist = useCallback(async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/templates/${id}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Kunde inte återställa checklista');
      }

      const result = await response.json();

      // Uppdatera checklistan med den nya data
      setChecklist(result.data);

      toast.success("Checklista återställd", {
        description: "Checklistan har återställts till standardmallen från organization_seeder."
      });
    } catch (error) {
      console.error("Fel vid återställning av checklista:", error);
      toast.error("Kunde inte återställa checklista", {
        description: "Ett fel uppstod vid återställning av checklista."
      });
    } finally {
      setSaving(false);
    }
  }, [id]);

  // Hämta organisationsinställningar
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
      // Sätt default till false om det inte går att hämta
      setBuddyEnabled(false);
    }
  }, []);

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

      fetchChecklist();
      fetchOrganizationSettings();
    }
  }, [status, session, router, id, fetchChecklist, fetchOrganizationSettings]);

  // Funktion för att hantera drag-start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);

    // Kolla om vi drar en kategori
    const draggedCategory = regularCategories.find(
      (cat) => cat.id === active.id
    );
    if (draggedCategory) {
      setActiveCategory(draggedCategory);
      setIsDraggingTask(false);
      return;
    }

    // Kolla om vi drar en uppgift (task)
    for (const category of regularCategories || []) {
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

    setActiveId(null);
    setActiveCategory(null);
    setActiveTask(null);
    setIsDraggingTask(false);

    if (!over || !checklist) return;

    // Om aktivt och över-element är samma, gör ingenting
    if (active.id === over.id) return;

    // Om vi drar en kategori
    if (!isDraggingTask) {
      const oldIndex = checklist.categories.findIndex(
        (cat) => cat.id === active.id
      );
      const newIndex = checklist.categories.findIndex(
        (cat) => cat.id === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const updatedCategories = arrayMove(
          checklist.categories,
          oldIndex,
          newIndex
        ).map((cat, index) => ({
          ...cat,
          order: index,
        }));

        setChecklist({
          ...checklist,
          categories: updatedCategories,
        });

        // Spara ändringarna till databasen
        handleSaveCategoryOrder(updatedCategories);
      }
    }
    // Om vi drar en uppgift: stöd både intra- och inter-kategori
    else {
      const sourceCategory = checklist.categories.find((cat) =>
        cat.tasks.some((task) => task.id === active.id)
      );

      // För att hitta targetCategory, leta både efter task-id och kategori-id
      const targetCategory = checklist.categories.find((cat) =>
        cat.id === over.id || cat.tasks.some((task) => task.id === over.id)
      );

      if (!sourceCategory || !targetCategory) return;

      // Inom samma kategori: bara reorder
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

        const updatedCategories = checklist.categories.map((cat) =>
          cat.id === sourceCategory.id
            ? { ...cat, tasks: reorderedTasks }
            : cat
        );

        setChecklist({
          ...checklist,
          categories: updatedCategories,
        });

        // Spara ändringarna till databasen
        handleSaveTaskOrder(reorderedTasks);
        return;
      }

      // Flytt mellan kategorier
      const movingTask = sourceCategory.tasks.find((t) => t.id === active.id);
      if (!movingTask) return;

      const sourceTasks = sourceCategory.tasks
        .filter((t) => t.id !== movingTask.id)
        .map((t, index) => ({ ...t, order: index }));

      // Om man släpper över en task i target, beräkna infogningsindex relativt target
      const overIndexInTarget = targetCategory.tasks.findIndex(
        (t) => t.id === over.id
      );
      const insertIndex = overIndexInTarget === -1
        ? targetCategory.tasks.length
        : overIndexInTarget;

      const targetTasks = [
        ...targetCategory.tasks.slice(0, insertIndex),
        { ...movingTask, categoryId: targetCategory.id },
        ...targetCategory.tasks.slice(insertIndex),
      ]
        .map((t, index) => ({ ...t, order: index }));

      const updatedCategories = checklist.categories.map((cat) => {
        if (cat.id === sourceCategory.id) return { ...cat, tasks: sourceTasks };
        if (cat.id === targetCategory.id) return { ...cat, tasks: targetTasks };
        return cat;
      });

      setChecklist({ ...checklist, categories: updatedCategories });

      // Uppdatera backend: sätt ny categoryId och ev. order
      const movedTaskNewOrder = targetTasks.find((t) => t.id === movingTask.id)?.order;
      fetch(`/api/tasks/${movingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: targetCategory.id, order: movedTaskNewOrder })
      }).catch(() => {
        // Vid fel, ladda om mallen för att återställa korrekt state
        fetchChecklist();
      });

      // Spara ny ordning i båda kategorierna
      handleSaveTaskOrder(sourceTasks);
      handleSaveTaskOrder(targetTasks);
    }
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
      fetchChecklist();
    } finally {
      setSaving(false);
    }
  };

  // Funktion för att spara uppgiftsordning till databasen
  const handleSaveTaskOrder = async (tasks: Task[]) => {
    if (!tasks || tasks.length === 0) {
      return;
    }
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
      fetchChecklist();
    } finally {
      setSaving(false);
    }
  };

  // Funktioner för att hantera kategorier
  const handleAddCategory = async () => {
    if (newCategory.name.trim() && checklist) {
      setSaving(true);

      try {
        const newCategoryObj = {
          name: newCategory.name,
          order: checklist.categories.length,
          checklistId: checklist.id,
          isBuddyCategory: false,
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

        // Stäng alla öppna dialoger
        const dialogs = document.querySelectorAll('[data-state="open"]');
        dialogs.forEach(dialog => {
          const closeButton = dialog.querySelector('button[aria-label="Close"]') as HTMLButtonElement;
          if (closeButton) {
            closeButton.click();
          }
        });

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

        // Stäng eventuell dialog/formulär programmatiskt
        const closeButton = document.querySelector(
          '[data-state="open"] button[aria-label="Close"]'
        ) as HTMLButtonElement;
        if (closeButton) {
          closeButton.click();
        }

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

  // Funktioner för att hantera uppgifter
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

        const newTaskObj = {
          title: newTask.title,
          description: newTask.description,
          link: newTask.link,
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
          isBuddyTask: false,
          categoryId: "",
        });

        // Stäng alla öppna dialoger
        const dialogs = document.querySelectorAll('[data-state="open"]');
        dialogs.forEach(dialog => {
          const closeButton = dialog.querySelector('button[aria-label="Close"]') as HTMLButtonElement;
          if (closeButton) {
            closeButton.click();
          }
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
    if (editingTask.title.trim() && editingTaskId && checklist) {
      setSaving(true);

      try {
        const updateData = {
          title: editingTask.title,
          description: editingTask.description,
          link: editingTask.link,
          isBuddyTask: false, // Always false in the regular template page
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
                    isBuddyTask: updatedTask.isBuddyTask,
                  }
                : task
            ),
          })),
        });

        // Spara id för att kunna scrolla till rätt uppgift efter att dialogen stängts
        const editedId = editingTaskId;
        setEditingTaskId(null);

        // Stäng dialogen programmatiskt
        const closeButton = document.querySelector(
          '[data-state="open"] button[aria-label="Close"]'
        ) as HTMLButtonElement;
        closeButton?.click();

        // Scrolla till uppgiften som uppdaterades
        requestAnimationFrame(() => {
          const el = document.getElementById(`task-${editedId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });

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
  if (!checklist) {
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
            <h1 className="text-2xl font-bold">Onboarding Checklista</h1>
            <p className="text-muted-foreground">
              Hantera mallen för nyanställda
            </p>
          </div>
        </div>

        {buddyEnabled && (
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/buddy-template/${id}`)}
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Hantera Buddyuppgifter
          </Button>
        )}
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
                  Återställ till standardmall
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Återställ checklista?</AlertDialogTitle>
              <AlertDialogDescription>
                Detta kommer att ta bort alla befintliga kategorier och uppgifter och ersätta dem med standardmallen från organization_seeder. Buddyuppgifter påverkas inte. Denna åtgärd kan inte ångras.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={resetChecklist}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Återställer...
                  </>
                ) : (
                  "Återställ"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Mallinställningar */}
      <Card>
        <CardHeader>
          <CardTitle>Mallinställningar</CardTitle>
          <CardDescription>
            Anpassa grundinställningar för mallen
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Kategorier och uppgifter */}
      <Card>
        <CardHeader>
          <CardTitle>Kategorier och uppgifter</CardTitle>
          <CardDescription>
            Hantera kategorier och uppgifter i checklistan. Dra och släpp för
            att ändra ordning. Buddyuppgifter hanteras separat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
          >
            <SortableContext
              items={categoryIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {regularCategories.map((category) => (
                  <SortableCategory
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
              {activeId && activeCategory ? (
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
                          <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full flex items-center">
                            <ClipboardCheck className="h-3 w-3 mr-1" />
                            Buddyuppgift
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
                    onClick={async () => {
                      await handleAddCategory();
                    }}
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
    </div>
  );
}
