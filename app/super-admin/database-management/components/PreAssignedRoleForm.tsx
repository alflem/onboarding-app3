"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertCircle, Check } from "lucide-react";

interface PreAssignedRoleFormProps {
  onRoleAdded: () => void;
}

export default function PreAssignedRoleForm({ onRoleAdded }: PreAssignedRoleFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "ADMIN" | "EMPLOYEE">("ADMIN");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !role) {
      setMessage({ type: "error", text: "Email och roll måste anges" });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: "error", text: "Ange en giltig e-postadress" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/super-admin/pre-assigned-roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message || "Fördefinierad roll tilldelad" });
        setEmail("");
        setRole("ADMIN");
        onRoleAdded();
      } else {
        setMessage({ type: "error", text: data.error || "Fel vid tilläggning av roll" });
      }
    } catch (error) {
      console.error("Error adding pre-assigned role:", error);
      setMessage({ type: "error", text: "Nätverksfel - försök igen" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Tilldela Roll Till Email
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="email">E-postadress</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="namn@xlent.se"
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="role">Roll</Label>
              <Select value={role} onValueChange={(value: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE") => setRole(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Välj roll" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">EMPLOYEE</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !email || !role}>
              {loading ? "Lägger till..." : "Tilldela Roll"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmail("");
                setRole("ADMIN");
                setMessage(null);
              }}
            >
              Rensa
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">ℹ️ Så fungerar det:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Ange e-postadress för en person som inte har skapat konto än</li>
            <li>• Välj vilken roll de ska få när de loggar in första gången</li>
            <li>• Personer med fördefinierade roller får automatiskt rätt behörigheter</li>
            <li>• Om personen redan har ett konto måste du ändra rollen direkt på användaren</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}