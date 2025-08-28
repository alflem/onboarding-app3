import React from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckSquare, List } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  link?: string;
  order: number;
  isBuddyTask: boolean;
  category: {
    id: string;
    name: string;
  };
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
}

interface ChecklistViewerProps {
  checklist: Checklist | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChecklistViewer({ checklist, isOpen, onClose }: ChecklistViewerProps) {
  if (!isOpen || !checklist) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Checklista för {checklist.organization.name}
          </CardTitle>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </CardHeader>
        <CardContent className="p-6">
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
              <div className="text-sm text-purple-700">Buddyuppgifter</div>
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
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{category.tasks.length} uppgifter</Badge>

                      </div>
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
        </CardContent>
      </div>
    </div>
  );
}
