/**
 * PlanBuilderContext — manages the in-progress proposal while browsing Discover.
 * Persisted to AsyncStorage so the plan survives navigation.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlanBuilderOption } from '@/types';

const STORAGE_KEY = '@planbuilder_options';
const GROUP_STORAGE_KEY = '@planbuilder_groupId';

interface PlanBuilderContextType {
  options: PlanBuilderOption[];
  groupId: string | null;
  setGroupId: (id: string | null) => void;
  addOption: (option: Omit<PlanBuilderOption, 'id'>) => void;
  removeOption: (id: string) => void;
  clearPlan: () => void;
}

const PlanBuilderContext = createContext<PlanBuilderContextType>({
  options: [],
  groupId: null,
  setGroupId: () => {},
  addOption: () => {},
  removeOption: () => {},
  clearPlan: () => {},
});

export function PlanBuilderProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<PlanBuilderOption[]>([]);
  const [groupId, setGroupIdState] = useState<string | null>(null);
  const initialized = useRef(false);

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const [stored, storedGroup] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(GROUP_STORAGE_KEY),
        ]);
        if (stored) setOptions(JSON.parse(stored));
        if (storedGroup) setGroupIdState(storedGroup);
      } catch {
        // ignore storage errors
      } finally {
        initialized.current = true;
      }
    })();
  }, []);

  // Persist options whenever they change (after initial load)
  useEffect(() => {
    if (!initialized.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(options)).catch(() => {});
  }, [options]);

  const setGroupId = useCallback((id: string | null) => {
    setGroupIdState(id);
    if (id) {
      AsyncStorage.setItem(GROUP_STORAGE_KEY, id).catch(() => {});
    } else {
      AsyncStorage.removeItem(GROUP_STORAGE_KEY).catch(() => {});
    }
  }, []);

  const addOption = useCallback((opt: Omit<PlanBuilderOption, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setOptions((prev) => {
      if (prev.length >= 5) return prev;
      // Dedupe by name+address
      const key = opt.name + (opt.address ?? '');
      if (prev.some((o) => o.name + (o.address ?? '') === key)) return prev;
      return [...prev, { ...opt, id }];
    });
  }, []);

  const removeOption = useCallback((id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const clearPlan = useCallback(() => {
    setOptions([]);
    setGroupIdState(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    AsyncStorage.removeItem(GROUP_STORAGE_KEY).catch(() => {});
  }, []);

  return (
    <PlanBuilderContext.Provider
      value={{ options, groupId, setGroupId, addOption, removeOption, clearPlan }}
    >
      {children}
    </PlanBuilderContext.Provider>
  );
}

export function usePlanBuilder() {
  return useContext(PlanBuilderContext);
}
