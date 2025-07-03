"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Check, UserPlus } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface BuddyPreparation {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  buddyId: string;
  notes?: string;
  buddy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface BuddyPreparationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preparation?: BuddyPreparation;
  organizationId?: string;
}

export default function BuddyPreparationForm({
  isOpen,
  onClose,
  onSuccess,
  preparation,
  organizationId,
}: BuddyPreparationFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [potentialBuddies, setPotentialBuddies] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    buddyId: "",
    notes: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Set form data when preparation changes
  useEffect(() => {
    if (preparation) {
      setFormData({
        firstName: preparation.firstName,
        lastName: preparation.lastName,
        email: preparation.email || "",
        buddyId: preparation.buddyId,
        notes: preparation.notes || "",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        buddyId: "",
        notes: "",
      });
    }
    setMessage(null);
  }, [preparation, isOpen]);

    const fetchPotentialBuddies = useCallback(async () => {
    try {
      const orgId = organizationId || session?.user?.organizationId;
      if (!orgId) {
        console.log("No organization ID found");
        return;
      }

      console.log("Fetching users for organization:", orgId);
      const response = await fetch(`/api/organization/users`);

      if (response.ok) {
        const data = await response.json();
        console.log("Received users data:", data);

        // API returns users directly as an array, not wrapped in data property
        const allUsers = Array.isArray(data) ? data : [];

        // Filter out employees - only admins and above can be buddies
        let buddies = allUsers.filter((user: User) => user.role !== "EMPLOYEE");
        console.log("Filtered buddies (non-employees):", buddies);

        // Put current user first in the list
        if (session?.user?.id) {
          const currentUserIndex = buddies.findIndex((user: User) => user.id === session.user.id);
          if (currentUserIndex > -1) {
            const currentUser = buddies.splice(currentUserIndex, 1)[0];
            buddies = [currentUser, ...buddies];
            console.log("Moved current user to front:", currentUser);
          }
        }

        setPotentialBuddies(buddies);

        // Auto-select current user as buddy if this is a new preparation
        if (!preparation && session?.user?.id && buddies.length > 0) {
          const currentUser = buddies.find((user: User) => user.id === session.user.id);
          if (currentUser) {
            setFormData(prev => ({
              ...prev,
              buddyId: currentUser.id,
            }));
            console.log("Auto-selected current user as buddy:", currentUser);
          }
        }
      } else {
        console.error("Failed to fetch users:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("Error fetching potential buddies:", error);
    }
  }, [organizationId, session?.user?.organizationId, session?.user?.id, preparation]);

  // Fetch potential buddies when dialog opens
  useEffect(() => {
    if (isOpen && !potentialBuddies.length) {
      fetchPotentialBuddies();
    }
  }, [isOpen, fetchPotentialBuddies, potentialBuddies.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.buddyId) {
      setMessage({ type: "error", text: "Förnamn, efternamn och buddy måste anges" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const url = preparation
        ? `/api/buddy-preparations/${preparation.id}`
        : "/api/buddy-preparations";

      const method = preparation ? "PUT" : "POST";

      const requestData = {
        ...formData,
        organizationId: organizationId || session?.user?.organizationId,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message || (preparation ? "Förberedelse uppdaterad" : "Förberedelse skapad")
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Ett fel uppstod" });
      }
    } catch (error) {
      console.error("Error saving buddy preparation:", error);
      setMessage({ type: "error", text: "Nätverksfel - försök igen" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (message) setMessage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
                          {preparation ? "Redigera Buddyförberedelse" : "Skapa Buddyförberedelse"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Förnamn *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Ange förnamn"
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="lastName">Efternamn *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Ange efternamn"
                disabled={loading}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">E-postadress (valfri)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="namn@företag.se (används för automatisk koppling)"
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="buddyId">Välj Buddy *</Label>
            <Select
              value={formData.buddyId}
              onValueChange={(value) => handleInputChange("buddyId", value)}
              disabled={loading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Välj en buddy" />
              </SelectTrigger>
              <SelectContent>
                {potentialBuddies.map((buddy) => (
                  <SelectItem key={buddy.id} value={buddy.id}>
                    <div className="flex items-center gap-2">
                      <span>{buddy.name}</span>
                      {buddy.id === session?.user?.id && (
                        <span className="text-xs font-medium text-primary">(Du)</span>
                      )}
                      <span className="text-xs text-muted-foreground">({buddy.role})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {potentialBuddies.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Inga tillgängliga buddies hittades
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Anteckningar (valfritt)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Lägg till eventuella anteckningar om den nyanställda..."
              disabled={loading}
              rows={3}
              className="mt-1"
            />
          </div>

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              {message.type === "success" ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">ℹ️ Så fungerar det:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Skapa en förberedelse innan den nyanställda har skapat sitt konto</li>
              <li>• Buddyn får tillgång till buddy-checklistan och kan börja förbereda</li>
              <li>• Om du anger e-postadress kopplas förberedelsen automatiskt när personen loggar in</li>
              <li>• Utan e-postadress måste kopplingen göras manuellt senare</li>
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {preparation ? "Uppdatera" : "Skapa"} Förberedelse
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}