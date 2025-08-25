"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
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
  const { data: session, status } = useSession();
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>("EMPLOYEE");
  const [actualUserRole, setActualUserRole] = useState<ViewMode | null>(null);

  // Memoize the user role to prevent unnecessary updates
  const userRole = useMemo(() => {
    return session?.user?.role as ViewMode | null;
  }, [session?.user?.role]);

  // Initialize actual user role and current view mode
  useEffect(() => {
    // Only update if we have a valid session and the role has actually changed
    if (status === "authenticated" && userRole && userRole !== actualUserRole) {
      setActualUserRole(userRole);

      // Load saved view mode from localStorage for super-admins
      if (userRole === "SUPER_ADMIN") {
        const savedViewMode = localStorage.getItem("super-admin-view-mode");
        if (savedViewMode && ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"].includes(savedViewMode)) {
          setCurrentViewMode(savedViewMode as ViewMode);
        } else {
          setCurrentViewMode(userRole);
        }
      } else {
        setCurrentViewMode(userRole);
      }
    }
  }, [userRole, actualUserRole, status]);

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