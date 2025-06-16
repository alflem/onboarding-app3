"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface User {
  id?: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
  organizationId?: string;
  buddyId?: string;
  password?: string;
}

interface Organization {
  id: string;
  name: string;
}

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  organizations: Organization[];
  users: User[];
  onSave: (data: User) => void;
}

export default function UserForm({ isOpen, onClose, user, organizations, users, onSave }: UserFormProps) {
  const [formData, setFormData] = useState<User>({
    name: "",
    email: "",
    role: "EMPLOYEE",
    organizationId: undefined,
    buddyId: undefined,
    password: ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        password: "" // Reset password field for security
      });
    } else {
      setFormData({
        name: "",
        email: "",
        role: "EMPLOYEE",
        organizationId: undefined,
        buddyId: undefined,
        password: ""
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Remove empty fields
    const submitData = { ...formData };
    if (!submitData.organizationId) delete submitData.organizationId;
    if (!submitData.buddyId) delete submitData.buddyId;
    if (!submitData.password) delete submitData.password;

    onSave(submitData);
  };

  // Filter out current user from buddy options
  const availableBuddies = users.filter(u => u.id !== user?.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {user ? "Redigera Användare" : "Skapa Ny Användare"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Namn</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Roll</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="organization">Organisation</Label>
            <Select
              value={formData.organizationId || "none"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, organizationId: value === "none" ? undefined : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj organisation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen organisation</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="buddy">Buddy</Label>
            <Select
              value={formData.buddyId || "none"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, buddyId: value === "none" ? undefined : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj buddy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen buddy</SelectItem>
                {availableBuddies.map(buddy => (
                  <SelectItem key={buddy.id} value={buddy.id || "unknown"}>
                    {buddy.name} ({buddy.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="password">
              Lösenord {user && "(lämna tomt för att behålla nuvarande)"}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder={user ? "Lämna tomt för att behålla" : "Ange lösenord"}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit">
              {user ? "Uppdatera" : "Skapa"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}