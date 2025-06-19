"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type ViewMode = "EMPLOYEE" | "ADMIN" | "SUPER_ADMIN";

interface ViewContextType {
  currentViewMode: ViewMode;
  actualUserRole: ViewMode | null;
  setViewMode: (mode: ViewMode) => void;
  isViewSwitchingEnabled: boolean;
  resetToActualRole: () => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>("EMPLOYEE");
  const [actualUserRole, setActualUserRole] = useState<ViewMode | null>(null);

  // Initialize actual user role and current view mode
  useEffect(() => {
    if (session?.user?.role) {
      const role = session.user.role as ViewMode;
      setActualUserRole(role);

      // Load saved view mode from localStorage for super-admins
      if (role === "SUPER_ADMIN") {
        const savedViewMode = localStorage.getItem("super-admin-view-mode");
        if (savedViewMode && ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"].includes(savedViewMode)) {
          setCurrentViewMode(savedViewMode as ViewMode);
        } else {
          setCurrentViewMode(role);
        }
      } else {
        setCurrentViewMode(role);
      }
    }
  }, [session?.user?.role]);

  const setViewMode = (mode: ViewMode) => {
    if (actualUserRole === "SUPER_ADMIN") {
      setCurrentViewMode(mode);
      localStorage.setItem("super-admin-view-mode", mode);
    }
  };

  const resetToActualRole = () => {
    if (actualUserRole) {
      setCurrentViewMode(actualUserRole);
      localStorage.removeItem("super-admin-view-mode");
    }
  };

  const isViewSwitchingEnabled = actualUserRole === "SUPER_ADMIN";

  return (
    <ViewContext.Provider
      value={{
        currentViewMode,
        actualUserRole,
        setViewMode,
        isViewSwitchingEnabled,
        resetToActualRole,
      }}
    >
      {children}
    </ViewContext.Provider>
  );
}

export function useViewContext() {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error("useViewContext must be used within a ViewProvider");
  }
  return context;
}