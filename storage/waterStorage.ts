import { WaterData } from '@/types/water';
import { formatDate, getDaysAgo } from '@/utils/date';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@water_tracker_data';
const LAST_ACCESSED_KEY = '@water_tracker_last_accessed';
const WIDGET_LAST_ADDED_KEY = '@water_tracker_widget_last_added';
const DEFAULT_GOAL = 3500; // ml
const DEFAULT_REMINDER_INTERVAL = 60; // 1 hour in minutes
const DEFAULT_WAKE_TIME = '07:00'; // 7 AM
const DEFAULT_SLEEP_TIME = '22:00'; // 10 PM
const HISTORY_DAYS = 7;
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/; // HH:mm format validation

/**
 * Gets the current water data from storage
 * Automatically initializes if no data exists
 */
async function getWaterData(): Promise<WaterData> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {
      entries: {},
      goal: DEFAULT_GOAL,
      reminderInterval: DEFAULT_REMINDER_INTERVAL,
      wakeTime: DEFAULT_WAKE_TIME,
      sleepTime: DEFAULT_SLEEP_TIME,
    };
  } catch (error) {
    if (__DEV__) console.error('Error getting water data:', error);
    return {
      entries: {},
      goal: DEFAULT_GOAL,
      reminderInterval: DEFAULT_REMINDER_INTERVAL,
      wakeTime: DEFAULT_WAKE_TIME,
      sleepTime: DEFAULT_SLEEP_TIME,
    };
  }
}

/**
 * Saves water data to storage
 */
async function saveWaterData(data: WaterData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    if (__DEV__) console.error('Error saving water data:', error);
    throw error;
  }
}

/**
 * Gets the last accessed date from storage
 */
async function getLastAccessedDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_ACCESSED_KEY);
  } catch (error) {
    if (__DEV__) console.error('Error getting last accessed date:', error);
    return null;
  }
}

/**
 * Saves the last accessed date to storage
 */
async function saveLastAccessedDate(date: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ACCESSED_KEY, date);
  } catch (error) {
    if (__DEV__) console.error('Error saving last accessed date:', error);
  }
}

/**
 * Checks if we need to create a new day entry (midnight has passed)
 * Returns true if it's a new day since last access
 */
async function isNewDay(): Promise<boolean> {
  const today = formatDate(new Date());
  const lastAccessed = await getLastAccessedDate();
  
  if (!lastAccessed) {
    // First time accessing, save today's date
    await saveLastAccessedDate(today);
    return false;
  }
  
  if (lastAccessed !== today) {
    // New day detected, update last accessed date
    await saveLastAccessedDate(today);
    return true;
  }
  
  return false;
}

/**
 * Removes entries older than HISTORY_DAYS (7 days)
 * Keeps only the last 7 days of history
 */
function cleanupOldEntries(entries: Record<string, number>): Record<string, number> {
  const cutoffDate = getDaysAgo(HISTORY_DAYS);
  const cutoffDateString = formatDate(cutoffDate);
  
  const cleanedEntries: Record<string, number> = {};
  
  for (const [date, amount] of Object.entries(entries)) {
    // Keep entries from the last 7 days (including today)
    if (date >= cutoffDateString) {
      cleanedEntries[date] = amount;
    }
  }
  
  return cleanedEntries;
}

/**
 * Ensures today's entry exists in the data
 * Creates it if it doesn't exist
 */
async function ensureTodayEntry(): Promise<void> {
  const isNew = await isNewDay();
  const data = await getWaterData();
  const today = formatDate(new Date());
  
  // If it's a new day or today's entry doesn't exist, initialize it
  if (isNew || !(today in data.entries)) {
    data.entries[today] = 0;
  }
  
  // Cleanup old entries (keep only last 7 days)
  data.entries = cleanupOldEntries(data.entries);
  
  await saveWaterData(data);
}

/**
 * Gets today's water intake amount
 * @returns Promise<number> - Today's water intake in ml
 */
export async function getToday(): Promise<number> {
  try {
    await ensureTodayEntry();
    const data = await getWaterData();
    const today = formatDate(new Date());
    return data.entries[today] || 0;
  } catch (error) {
    if (__DEV__) console.error('Error getting today\'s water:', error);
    return 0;
  }
}

/**
 * Adds water to today's intake
 * @param amount - Amount of water to add in ml (must be positive)
 * @returns Promise<number> - Updated today's water intake in ml
 * @throws Error if amount is invalid
 */
export async function addWater(amount: number): Promise<number> {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  
  try {
    await ensureTodayEntry();
    const data = await getWaterData();
    const today = formatDate(new Date());
    
    // Initialize today's entry if it doesn't exist
    if (!(today in data.entries)) {
      data.entries[today] = 0;
    }
    
    // Add the amount
    data.entries[today] += amount;
    
    // Cleanup old entries
    data.entries = cleanupOldEntries(data.entries);
    
    await saveWaterData(data);
    
    return data.entries[today];
  } catch (error) {
    if (__DEV__) console.error('Error adding water:', error);
    throw error;
  }
}

/**
 * Removes water from today's intake (for undo functionality)
 * @param amount - Amount of water to remove in ml (must be positive)
 * @returns Promise<number> - Updated today's water intake in ml
 * @throws Error if amount is invalid
 */
export async function removeWater(amount: number): Promise<number> {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  
  try {
    await ensureTodayEntry();
    const data = await getWaterData();
    const today = formatDate(new Date());
    
    // Initialize today's entry if it doesn't exist
    if (!(today in data.entries)) {
      data.entries[today] = 0;
    }
    
    // Remove the amount (don't go below 0)
    data.entries[today] = Math.max(0, data.entries[today] - amount);
    
    // Cleanup old entries
    data.entries = cleanupOldEntries(data.entries);
    
    await saveWaterData(data);
    
    return data.entries[today];
  } catch (error) {
    if (__DEV__) console.error('Error removing water:', error);
    throw error;
  }
}

/**
 * Sets the daily water goal
 * @param amount - Daily goal in ml (must be positive)
 * @returns Promise<number> - The set goal amount
 * @throws Error if amount is invalid
 */
export async function setGoal(amount: number): Promise<number> {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    throw new Error('Goal must be a positive number');
  }
  
  try {
    const data = await getWaterData();
    data.goal = amount;
    await saveWaterData(data);
    return data.goal;
  } catch (error) {
    if (__DEV__) console.error('Error setting goal:', error);
    throw error;
  }
}

/**
 * Gets the current daily water goal
 * @returns Promise<number> - Daily goal in ml
 */
export async function getGoal(): Promise<number> {
  try {
    const data = await getWaterData();
    return data.goal || DEFAULT_GOAL;
  } catch (error) {
    if (__DEV__) console.error('Error getting goal:', error);
    return DEFAULT_GOAL;
  }
}

/**
 * Sets the reminder interval
 * @param interval - Reminder interval in minutes (must be positive)
 * @returns Promise<number> - The set interval in minutes
 * @throws Error if interval is invalid
 */
export async function setReminderInterval(interval: number): Promise<number> {
  if (typeof interval !== 'number' || isNaN(interval) || interval <= 0) {
    throw new Error('Reminder interval must be a positive number');
  }
  
  try {
    const data = await getWaterData();
    data.reminderInterval = interval;
    await saveWaterData(data);
    return data.reminderInterval;
  } catch (error) {
    if (__DEV__) console.error('Error setting reminder interval:', error);
    throw error;
  }
}

/**
 * Gets the current reminder interval
 * @returns Promise<number> - Reminder interval in minutes
 */
export async function getReminderInterval(): Promise<number> {
  try {
    const data = await getWaterData();
    return data.reminderInterval || DEFAULT_REMINDER_INTERVAL;
  } catch (error) {
    if (__DEV__) console.error('Error getting reminder interval:', error);
    return DEFAULT_REMINDER_INTERVAL;
  }
}

/**
 * Gets water data for a specific date
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Promise<number> - Water intake for that date in ml
 */
export async function getWaterByDate(dateString: string): Promise<number> {
  try {
    const data = await getWaterData();
    return data.entries[dateString] || 0;
  } catch (error) {
    if (__DEV__) console.error('Error getting water by date:', error);
    return 0;
  }
}

/**
 * Gets the last 7 days of water history
 * @returns Promise<Record<string, number>> - Map of date strings to water amounts
 */
export async function getHistory(): Promise<Record<string, number>> {
  try {
    await ensureTodayEntry();
    const data = await getWaterData();
    return cleanupOldEntries(data.entries);
  } catch (error) {
    if (__DEV__) console.error('Error getting history:', error);
    return {};
  }
}

/**
 * Sets the wake time
 * @param time - Wake time in HH:mm format (e.g., "07:00")
 * @returns Promise<string> - The set wake time
 * @throws Error if time format is invalid
 */
export async function setWakeTime(time: string): Promise<string> {
  // Validate time format (HH:mm)
  if (!TIME_REGEX.test(time)) {
    throw new Error('Invalid time format. Expected HH:mm (e.g., "07:00")');
  }
  
  try {
    const data = await getWaterData();
    data.wakeTime = time;
    await saveWaterData(data);
    return data.wakeTime;
  } catch (error) {
    if (__DEV__) console.error('Error setting wake time:', error);
    throw error;
  }
}

/**
 * Gets the current wake time
 * @returns Promise<string> - Wake time in HH:mm format
 */
export async function getWakeTime(): Promise<string> {
  try {
    const data = await getWaterData();
    return data.wakeTime || DEFAULT_WAKE_TIME;
  } catch (error) {
    if (__DEV__) console.error('Error getting wake time:', error);
    return DEFAULT_WAKE_TIME;
  }
}

/**
 * Sets the sleep time
 * @param time - Sleep time in HH:mm format (e.g., "22:00")
 * @returns Promise<string> - The set sleep time
 * @throws Error if time format is invalid
 */
export async function setSleepTime(time: string): Promise<string> {
  // Validate time format (HH:mm)
  if (!TIME_REGEX.test(time)) {
    throw new Error('Invalid time format. Expected HH:mm (e.g., "22:00")');
  }
  
  try {
    const data = await getWaterData();
    data.sleepTime = time;
    await saveWaterData(data);
    return data.sleepTime;
  } catch (error) {
    if (__DEV__) console.error('Error setting sleep time:', error);
    throw error;
  }
}

/**
 * Gets the current sleep time
 * @returns Promise<string> - Sleep time in HH:mm format
 */
export async function getSleepTime(): Promise<string> {
  try {
    const data = await getWaterData();
    return data.sleepTime || DEFAULT_SLEEP_TIME;
  } catch (error) {
    if (__DEV__) console.error('Error getting sleep time:', error);
    return DEFAULT_SLEEP_TIME;
  }
}

/**
 * Clears all water tracking data
 * Use with caution - this is irreversible
 */
export async function clearWaterData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(LAST_ACCESSED_KEY);
  } catch (error) {
    if (__DEV__) console.error('Error clearing water data:', error);
    throw error;
  }
}

/**
 * Widget Undo Functions
 * Stores the last amount added via widget for undo functionality
 */
export async function setWidgetLastAdded(amount: number): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_LAST_ADDED_KEY, amount.toString());
  } catch (error) {
    if (__DEV__) console.error('Error setting widget last added:', error);
  }
}

export async function getWidgetLastAdded(): Promise<number> {
  try {
    const amount = await AsyncStorage.getItem(WIDGET_LAST_ADDED_KEY);
    return amount ? parseInt(amount, 10) : 0;
  } catch (error) {
    if (__DEV__) console.error('Error getting widget last added:', error);
    return 0;
  }
}

export async function clearWidgetLastAdded(): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_LAST_ADDED_KEY, '0');
  } catch (error) {
    if (__DEV__) console.error('Error clearing widget last added:', error);
  }
}
