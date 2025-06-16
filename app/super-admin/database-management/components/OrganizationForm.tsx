"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Organization {
  id?: string;
  name: string;
  buddyEnabled: boolean;
}

interface OrganizationFormProps {
  isOpen: boolean;
  onClose: () => void;
  organization?: Organization;
  onSave: (data: Organization) => void;
}

export default function OrganizationForm({ isOpen, onClose, organization, onSave }: OrganizationFormProps) {
  const [formData, setFormData] = useState<Organization>({
    name: "",
    buddyEnabled: true
  });

  useEffect(() => {
    if (organization) {
      setFormData(organization);
    } else {
      setFormData({
        name: "",
        buddyEnabled: true
      });
    }
  }, [organization]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {organization ? "Redigera Organisation" : "Skapa Ny Organisation"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Organisationsnamn</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="buddyEnabled"
              checked={formData.buddyEnabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, buddyEnabled: !!checked }))
              }
            />
            <Label htmlFor="buddyEnabled">Buddy-system aktiverat</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit">
              {organization ? "Uppdatera" : "Skapa"}
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