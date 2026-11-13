import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type FundGoal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  color: string;
  pinned: boolean;
  deadline?: string;
};

export type ScheduleItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'event' | 'deadline';
  goalId?: string;
  done: boolean;
};

export type FocusSession = {
  mode: 'timer' | 'stopwatch' | null;
  durationMs: number;
  elapsedMs: number;
  runningSince: number | null;
  lastSession: { label: string; durationMs: number } | null;
};

type AppState = {
  goals: FundGoal[];
  schedule: ScheduleItem[];
  focus: FocusSession;
};

type AppData = AppState & {
  ready: boolean;
  storageError: string | null;
  retryStorage: () => void;
  addGoal: (goal: Omit<FundGoal, 'id' | 'saved' | 'pinned'>) => void;
  addContribution: (goalId: string, amount: number) => void;
  togglePinned: (goalId: string) => void;
  updateGoalDeadline: (goalId: string, deadline: string, time: string) => void;
  addScheduleItem: (item: Omit<ScheduleItem, 'id' | 'done'>) => void;
  toggleScheduleItem: (itemId: string) => void;
  updateFocus: (focus: FocusSession) => void;
};

// Keep this key stable so existing installs retain their saved data after the rename.
const STORAGE_KEY = 'daymark.app-state.v1';
const today = new Date();
const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const initialState: AppState = {
  goals: [
    { id: 'emergency', name: 'Emergency fund', target: 8000, saved: 4250, color: '#286B58', pinned: true, deadline: '2027-06-30' },
    { id: 'travel', name: 'Summer in Japan', target: 3200, saved: 1860, color: '#D3945C', pinned: false },
    { id: 'home', name: 'New home setup', target: 5000, saved: 950, color: '#7886A6', pinned: false },
  ],
  schedule: [
    { id: 'budget-checkin', title: 'Review your weekly budget', date: todayKey, time: '09:30', type: 'event', done: false },
    { id: 'savings-checkin', title: 'Set aside savings for the month', date: todayKey, time: '15:00', type: 'event', done: false },
    { id: 'emergency-deadline', title: 'Emergency fund deadline', date: '2027-06-30', time: '12:00', type: 'deadline', goalId: 'emergency', done: false },
  ],
  focus: { mode: null, durationMs: 25 * 60 * 1000, elapsedMs: 0, runningSince: null, lastSession: null },
};

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AppState>;
  return (
    Array.isArray(candidate.goals) &&
    candidate.goals.every((goal) =>
      !!goal &&
      typeof goal.id === 'string' &&
      typeof goal.name === 'string' &&
      Number.isFinite(goal.target) && goal.target > 0 &&
      Number.isFinite(goal.saved) && goal.saved >= 0 &&
      typeof goal.color === 'string' &&
      typeof goal.pinned === 'boolean',
    ) &&
    Array.isArray(candidate.schedule) &&
    candidate.schedule.every((item) =>
      !!item &&
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.date === 'string' &&
      typeof item.time === 'string' &&
      (item.type === 'event' || item.type === 'deadline') &&
      typeof item.done === 'boolean',
    ) &&
    !!candidate.focus &&
    (candidate.focus.mode === null || candidate.focus.mode === 'timer' || candidate.focus.mode === 'stopwatch') &&
    Number.isFinite(candidate.focus.durationMs) &&
    Number.isFinite(candidate.focus.elapsedMs) &&
    (candidate.focus.runningSince === null || Number.isFinite(candidate.focus.runningSince)) &&
    (candidate.focus.lastSession === null ||
      (typeof candidate.focus.lastSession.label === 'string' &&
        Number.isFinite(candidate.focus.lastSession.durationMs)))
  );
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const [canPersist, setCanPersist] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (!isAppState(parsed)) throw new Error('Saved AIO Place data has an invalid shape.');
          setState(parsed);
        }
        setCanPersist(true);
      })
      .catch((error: unknown) => {
        console.error('Could not load saved AIO Place data.', error);
        if (active) setStorageError('Your saved data could not be read, so it has been left untouched.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  useEffect(() => {
    if (!ready || !canPersist) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error: unknown) => {
      console.error('Could not save AIO Place data.', error);
      setStorageError('Your latest changes could not be saved. They are still open in this session.');
    });
  }, [canPersist, ready, state]);

  const value = useMemo<AppData>(
    () => ({
      ...state,
      ready,
      storageError,
      retryStorage: () => {
        if (!canPersist) {
          setReady(false);
          setStorageError(null);
          setLoadAttempt((attempt) => attempt + 1);
          return;
        }
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state))
          .then(() => setStorageError(null))
          .catch((error: unknown) => {
            console.error('Could not save AIO Place data after retry.', error);
            setStorageError('Your latest changes could not be saved. They are still open in this session.');
          });
      },
      addGoal: (goal) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setState((current) => {
          return {
            ...current,
            goals: [
              ...current.goals,
              { ...goal, id, saved: 0, pinned: current.goals.length === 0 },
            ],
            schedule: goal.deadline
              ? [
                  ...current.schedule,
                  {
                    id: `${id}-deadline`,
                    title: `${goal.name} deadline`,
                    date: goal.deadline,
                    time: '12:00',
                    type: 'deadline',
                    goalId: id,
                    done: false,
                  },
                ]
              : current.schedule,
          };
        });
      },
      addContribution: (goalId, amount) =>
        setState((current) => ({
          ...current,
          goals: current.goals.map((goal) =>
            goal.id === goalId ? { ...goal, saved: goal.saved + amount } : goal,
          ),
        })),
      togglePinned: (goalId) =>
        setState((current) => ({
          ...current,
          goals: current.goals.map((goal) => ({ ...goal, pinned: goal.id === goalId })),
        })),
      updateGoalDeadline: (goalId, deadline, time) => {
        const id = `${goalId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setState((current) => {
          const goal = current.goals.find((item) => item.id === goalId);
          if (!goal) return current;
          return {
            ...current,
            goals: current.goals.map((item) => item.id === goalId ? { ...item, deadline } : item),
            schedule: [
              ...current.schedule.filter((item) => item.type !== 'deadline' || item.goalId !== goalId),
              {
                id,
                title: `${goal.name} deadline`,
                date: deadline,
                time,
                type: 'deadline',
                goalId,
                done: false,
              },
            ],
          };
        });
      },
      addScheduleItem: (item) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setState((current) => ({
          ...current,
          schedule: [...current.schedule, { ...item, id, done: false }],
        }));
      },
      toggleScheduleItem: (itemId) =>
        setState((current) => ({
          ...current,
          schedule: current.schedule.map((item) =>
            item.id === itemId ? { ...item, done: !item.done } : item,
          ),
        })),
      updateFocus: (focus) => setState((current) => ({ ...current, focus })),
    }),
    [canPersist, ready, state, storageError],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider.');
  return context;
}
