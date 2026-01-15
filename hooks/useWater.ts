import {
    addWater as addWaterStorage,
    getGoal,
    getReminderInterval,
    getSleepTime,
    getToday,
    getWakeTime,
    removeWater as removeWaterStorage,
    setGoal as setGoalStorage,
    setReminderInterval as setReminderIntervalStorage,
    setSleepTime as setSleepTimeStorage,
    setWakeTime as setWakeTimeStorage,
} from '@/storage/waterStorage';
import { formatDate } from '@/utils/date';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseWaterReturn {
  consumed: number;
  goal: number;
  progress: number;
  loading: boolean;
  error: string | null;
  lastAddedAmount: number | null;
  canUndo: boolean;
  reminderInterval: number;
  wakeTime: string;
  sleepTime: string;
  addWater: (amount: number) => Promise<void>;
  removeWater: (amount: number) => Promise<void>;
  undo: () => Promise<void>;
  setGoal: (amount: number) => Promise<void>;
  setReminderInterval: (interval: number) => Promise<void>;
  setWakeTime: (time: string) => Promise<void>;
  setSleepTime: (time: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing water tracking
 * - Loads today's water data on mount
 * - Exposes consumed, goal, and progress percentage
 * - Provides addWater and setGoal functions
 * - Handles day change automatically
 * - Uses AsyncStorage utility functions
 */
export function useWater(): UseWaterReturn {
  const [consumed, setConsumed] = useState<number>(0);
  const [goal, setGoal] = useState<number>(3500);
  const [reminderInterval, setReminderInterval] = useState<number>(60);
  const [wakeTime, setWakeTime] = useState<string>('07:00');
  const [sleepTime, setSleepTime] = useState<string>('22:00');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAddedAmount, setLastAddedAmount] = useState<number | null>(null);
  
  // Track current date to detect day changes
  const currentDateRef = useRef<string>(formatDate(new Date()));
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  
  const canUndo = lastAddedAmount !== null && lastAddedAmount > 0;

  /**
   * Calculates progress percentage (0-100), clamped to prevent negative or over 100%
   */
  const progress = goal > 0 
    ? Math.min(Math.max((Math.max(consumed, 0) / goal) * 100, 0), 100) 
    : 0;

  /**
   * Loads today's water data from storage
   */
  const loadTodayData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [todayAmount, currentGoal, currentInterval, currentWakeTime, currentSleepTime] = await Promise.all([
        getToday(),
        getGoal(),
        getReminderInterval(),
        getWakeTime(),
        getSleepTime(),
      ]);
      
      // Prevent negative values
      setConsumed(Math.max(todayAmount, 0));
      setGoal(currentGoal);
      setReminderInterval(currentInterval);
      setWakeTime(currentWakeTime);
      setSleepTime(currentSleepTime);
      
      // Update current date reference
      currentDateRef.current = formatDate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load water data';
      setError(errorMessage);
      if (__DEV__) console.error('Error loading water data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Checks if day has changed and refreshes data if needed
   */
  const checkDayChange = useCallback(async () => {
    const today = formatDate(new Date());
    if (currentDateRef.current !== today) {
      // Day has changed, refresh data
      await loadTodayData();
    }
  }, [loadTodayData]);

  /**
   * Handles app state changes (foreground/background)
   * Refreshes data when app comes to foreground to handle day changes
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground, check for day change
        checkDayChange();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkDayChange]);

  /**
   * Periodically check for day changes (every minute)
   * This ensures day changes are detected even if app stays open
   */
  useEffect(() => {
    const interval = setInterval(() => {
      checkDayChange();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkDayChange]);

  /**
   * Load data on mount
   */
  useEffect(() => {
    loadTodayData();
  }, [loadTodayData]);

  /**
   * Adds water to today's intake
   */
  const addWater = useCallback(async (amount: number): Promise<void> => {
    try {
      setError(null);
      
      // Optimistic update - prevent negative values
      const newAmount = Math.max(consumed + amount, 0);
      setConsumed(newAmount);
      
      // Update storage
      const updatedAmount = await addWaterStorage(amount);
      
      // Sync with actual value from storage (handles day changes) - prevent negative
      setConsumed(Math.max(updatedAmount, 0));
      
      // Store last added amount for undo
      setLastAddedAmount(amount);
      
      // Check if day changed during the operation
      await checkDayChange();
    } catch (err) {
      // Revert optimistic update on error
      await loadTodayData();
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to add water';
      setError(errorMessage);
      throw err;
    }
  }, [consumed, checkDayChange, loadTodayData]);

  /**
   * Removes water from today's intake
   */
  const removeWater = useCallback(async (amount: number): Promise<void> => {
    try {
      setError(null);
      
      // Optimistic update - ensure never goes negative
      const newAmount = Math.max(0, consumed - amount);
      setConsumed(Math.max(0, newAmount));
      
      // Update storage
      const updatedAmount = await removeWaterStorage(amount);
      
      // Sync with actual value from storage - prevent negative
      setConsumed(Math.max(updatedAmount, 0));
      
      // Clear undo state after removing
      setLastAddedAmount(null);
      
      // Check if day changed during the operation
      await checkDayChange();
    } catch (err) {
      // Revert optimistic update on error
      await loadTodayData();
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove water';
      setError(errorMessage);
      throw err;
    }
  }, [consumed, checkDayChange, loadTodayData]);

  /**
   * Undo the last water addition
   */
  const undo = useCallback(async (): Promise<void> => {
    if (lastAddedAmount !== null && lastAddedAmount > 0) {
      await removeWater(lastAddedAmount);
    }
  }, [lastAddedAmount, removeWater]);

  /**
   * Sets the daily water goal
   */
  const updateGoal = useCallback(async (amount: number): Promise<void> => {
    try {
      setError(null);
      
      // Optimistic update
      setGoal(amount);
      
      // Update storage
      const updatedGoal = await setGoalStorage(amount);
      
      // Sync with actual value from storage
      setGoal(updatedGoal);
    } catch (err) {
      // Revert optimistic update on error
      await loadTodayData();
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to set goal';
      setError(errorMessage);
      throw err;
    }
  }, [loadTodayData]);

  /**
   * Sets the reminder interval
   */
  const updateReminderInterval = useCallback(async (interval: number): Promise<void> => {
    try {
      setError(null);
      
      // Optimistic update
      setReminderInterval(interval);
      
      // Update storage
      const updatedInterval = await setReminderIntervalStorage(interval);
      
      // Sync with actual value from storage
      setReminderInterval(updatedInterval);
    } catch (err) {
      // Revert optimistic update on error
      await loadTodayData();
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to set reminder interval';
      setError(errorMessage);
      throw err;
    }
  }, [loadTodayData]);

  /**
   * Sets the wake time
   */
  const updateWakeTime = useCallback(async (time: string): Promise<void> => {
    try {
      setError(null);
      
      // Optimistic update
      setWakeTime(time);
      
      // Update storage
      const updatedTime = await setWakeTimeStorage(time);
      
      // Sync with actual value from storage
      setWakeTime(updatedTime);
    } catch (err) {
      // Revert optimistic update on error
      await loadTodayData();
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to set wake time';
      setError(errorMessage);
      throw err;
    }
  }, [loadTodayData]);

  /**
   * Sets the sleep time
   */
  const updateSleepTime = useCallback(async (time: string): Promise<void> => {
    try {
      setError(null);
      
      // Optimistic update
      setSleepTime(time);
      
      // Update storage
      const updatedTime = await setSleepTimeStorage(time);
      
      // Sync with actual value from storage
      setSleepTime(updatedTime);
    } catch (err) {
      // Revert optimistic update on error
      await loadTodayData();
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to set sleep time';
      setError(errorMessage);
      throw err;
    }
  }, [loadTodayData]);

  /**
   * Manually refresh water data
   */
  const refresh = useCallback(async (): Promise<void> => {
    await loadTodayData();
  }, [loadTodayData]);

  return {
    consumed,
    goal,
    progress,
    loading,
    error,
    lastAddedAmount,
    canUndo,
    reminderInterval,
    wakeTime,
    sleepTime,
    addWater,
    removeWater,
    undo,
    setGoal: updateGoal,
    setReminderInterval: updateReminderInterval,
    setWakeTime: updateWakeTime,
    setSleepTime: updateSleepTime,
    refresh,
  };
}
