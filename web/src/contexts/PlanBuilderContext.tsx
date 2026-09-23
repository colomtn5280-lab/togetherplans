/**
 * PlanBuilderContext — web version
 * Persists to localStorage. Provides options, addOption, removeOption, clearPlan.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { PlanBuilderOption } from "../types";

const STORAGE_KEY = "planbuilder_options";

interface PlanBuilderContextType {
  options: PlanBuilderOption[];
  addOption: (opt: Omit<PlanBuilderOption, "id">) => void;
  removeOption: (id: string) => void;
  clearPlan: () => void;
}

const PlanBuilderContext = createContext<PlanBuilderContextType>({
  options: [],
  addOption: () => {},
  removeOption: () => {},
  clearPlan: () => {},
});

export function PlanBuilderProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<PlanBuilderOption[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
      // ignore
    }
  }, [options]);

  const addOption = useCallback((opt: Omit<PlanBuilderOption, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setOptions((prev) => {
      if (prev.length >= 5) return prev;
      const key = opt.name + (opt.address ?? "");
      if (prev.some((o) => o.name + (o.address ?? "") === key)) return prev;
      return [...prev, { ...opt, id }];
    });
  }, []);

  const removeOption = useCallback((id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const clearPlan = useCallback(() => {
    setOptions([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <PlanBuilderContext.Provider value={{ options, addOption, removeOption, clearPlan }}>
      {children}
    </PlanBuilderContext.Provider>
  );
}

export function usePlanBuilder() {
  return useContext(PlanBuilderContext);
}
