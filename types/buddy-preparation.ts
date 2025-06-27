export interface BuddyPreparation {
  id: string;
  upcomingEmployeeName: string;
  upcomingEmployeeEmail?: string | null;
  buddyId: string;
  organizationId: string;
  notes?: string | null;
  isActive: boolean;
  linkedUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  buddy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  linkedUser?: {
    id: string;
    name: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

export interface CreateBuddyPreparationData {
  upcomingEmployeeName: string;
  upcomingEmployeeEmail?: string;
  buddyId: string;
  notes?: string;
}

export interface UpdateBuddyPreparationData {
  upcomingEmployeeName?: string;
  upcomingEmployeeEmail?: string;
  buddyId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface BuddyPreparationResponse {
  id: string;
  upcomingEmployeeName: string;
  upcomingEmployeeEmail?: string | null;
  buddyId: string;
  organizationId: string;
  notes?: string | null;
  isActive: boolean;
  linkedUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}