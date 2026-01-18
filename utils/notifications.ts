import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Notification channel ID for Android
 * Must be consistent across the app
 */
const WATER_REMINDER_CHANNEL_ID = 'water-reminder';

/**
 * Notification identifier prefix for water reminders
 * Used to identify and cancel all water-related notifications
 */
const WATER_REMINDER_ID_PREFIX = 'water-reminder-';

/**
 * Funny Hinglish notification messages
 * These rotate with each notification throughout the day
 */
const HINGLISH_MESSAGES = [
  "Bhai paani pi, kidney boli please! 💧",
  "Paani pi le varna skin dull ho jayegi, phir selfie kaun lega? 📸",
  "Hydration ka time hai, chal uth! 🚰",
  "Pani pi le warna headache free milega! 🤕",
  "Bro water break le, body boli thank you bolegi! 🙏",
  "Chai coffee chhod, paani ka number hai ab! ☕➡️💧",
  "Tera body 70% paani hai, top up kar de thoda! 🔋",
  "Paani pi, glow aayega FREE mein! ✨",
  "Dehydration se bachna hai toh paani pee ja! 🏃",
  "Filter coffee nahi, filtered paani pi! 💪",
  "H2O time! Apni body ko pyaar de! 💙",
  "Paani nahi piyega toh thak jayega, chal pi le! 😴",
  "Doctor se milna hai ya paani peena hai? Choice is yours! 🏥",
  "Ek glass paani = Happy organs! 🎉",
  "Chal bhai, paani pi aur kaam pe lag! 💼",
  "Skin glow chahiye? Paani pi pehle! 🌟",
  "Energy low? Paani high kar! ⚡",
  "Boss bole ya na bole, body boli paani pi! 😎",
  "Paani peene se IQ badhta hai, sach mein! 🧠",
];

/**
 * Check if running in Expo Go (where notifications have limited support)
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/**
 * Configure notification handler for both iOS and Android
 * Ensures notifications show alerts, play sounds, and set badges
 * Only sets up in development/production builds, not in Expo Go
 */
function setupNotificationHandler(): void {
  // Skip setup in Expo Go where notifications aren't fully supported
  if (isExpoGo()) {
    return;
  }

  try {
    if (Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (error) {
    // Silently handle if notifications are not available
    // This is expected in Expo Go
  }
}

// Initialize notification handler (only if not in Expo Go)
setupNotificationHandler();

/**
 * Creates and configures Android notification channel
 * Must be called before scheduling any notifications on Android
 * 
 * Channel settings:
 * - MAX importance: Highest priority, shows on lockscreen, makes sound, vibrates
 * - Sound: Enabled (uses default notification sound)
 * - Vibration: Enabled
 * - Lockscreen visibility: Public (shows on lockscreen)
 */
async function setupAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync(WATER_REMINDER_CHANNEL_ID, {
      name: 'Water Reminders',
      description: 'Notifications to remind you to drink water throughout the day',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default', // Use default notification sound
      vibrationPattern: [0, 250, 250, 250], // Vibrate pattern
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: true,
    });
  } catch (error) {
    console.error('Error setting up Android notification channel:', error);
    // Don't throw - allow app to continue even if channel setup fails
  }
}

/**
 * Creates and configures Android notification channel (exported version)
 * This is the main function to call for setting up the channel
 * 
 * Channel ID: 'water-reminder'
 * - MAX importance: Highest priority
 * - Sound: Enabled (default)
 * - Vibration: Enabled with pattern [0, 500, 500, 500]
 * - Lockscreen visibility: Public
 */
export async function createWaterReminderChannel(): Promise<void> {
  // Skip in Expo Go where notifications aren't fully supported
  if (isExpoGo()) {
    return;
  }

  if (Platform.OS === 'android') {
    try {
      if (Notifications.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync('water-reminder', {
          name: 'Water Reminder',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'default', // 🔊 THIS IS KEY
          vibrationPattern: [0, 500, 500, 500],
          enableVibrate: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
    } catch (error) {
      // Silently handle errors (expected in Expo Go)
      console.warn('Error creating water reminder channel:', error);
    }
  }
}

/**
 * Requests notification permissions from the user
 * Must be called before scheduling notifications
 * 
 * @returns Promise<boolean> - true if permissions granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // Skip in Expo Go where notifications aren't fully supported
  if (isExpoGo()) {
    console.log('Notifications not available in Expo Go. Use a development build for full functionality.');
    return false;
  }

  try {
    // Check if notifications are available
    if (!Notifications.getPermissionsAsync || !Notifications.requestPermissionsAsync) {
      console.warn('Notification APIs not available');
      return false;
    }

    // Setup Android channel first (required for Android 8.0+)
    await createWaterReminderChannel();

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Only request if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    // Gracefully handle errors
    console.warn('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Parses time string (HH:mm) into hours and minutes
 * 
 * @param timeString - Time in HH:mm format (e.g., "08:30)
 * @returns { hour: number, minute: number } - Parsed time
 * @throws Error if time format is invalid
 */
function parseTime(timeString: string): { hour: number; minute: number } {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
  const match = timeString.match(timeRegex);

  if (!match) {
    throw new Error(`Invalid time format: ${timeString}. Expected HH:mm format.`);
  }

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  return { hour, minute };
}

/**
 * Calculates minutes between two times, handling midnight crossing
 * 
 * @param wakeHour - Wake hour (0-23)
 * @param wakeMinute - Wake minute (0-59)
 * @param sleepHour - Sleep hour (0-23)
 * @param sleepMinute - Sleep minute (0-59)
 * @returns Total minutes between wake and sleep time
 */
function calculateAvailableMinutes(
  wakeHour: number,
  wakeMinute: number,
  sleepHour: number,
  sleepMinute: number
): number {
  const wakeMinutes = wakeHour * 60 + wakeMinute;
  const sleepMinutes = sleepHour * 60 + sleepMinute;

  // Handle case where sleep time is next day (crosses midnight)
  if (sleepMinutes <= wakeMinutes) {
    // Sleep time is next day, add 24 hours
    return (24 * 60 - wakeMinutes) + sleepMinutes;
  }

  return sleepMinutes - wakeMinutes;
}

/**
 * Calculates evenly spaced notification times between wake and sleep
 * 
 * @param totalReminders - Total number of reminders to schedule
 * @param wakeHour - Wake hour (0-23)
 * @param wakeMinute - Wake minute (0-59)
 * @param sleepHour - Sleep hour (0-23)
 * @param sleepMinute - Sleep minute (0-59)
 * @returns Array of { hour, minute } objects for each reminder
 */
function calculateNotificationTimes(
  totalReminders: number,
  wakeHour: number,
  wakeMinute: number,
  sleepHour: number,
  sleepMinute: number
): Array<{ hour: number; minute: number }> {
  if (totalReminders <= 0) {
    return [];
  }

  const availableMinutes = calculateAvailableMinutes(
    wakeHour,
    wakeMinute,
    sleepHour,
    sleepMinute
  );

  // Calculate interval between reminders
  // For n reminders, we need n-1 intervals
  const intervalMinutes = totalReminders > 1 
    ? Math.floor(availableMinutes / totalReminders)
    : availableMinutes;

  const times: Array<{ hour: number; minute: number }> = [];
  let currentMinutes = wakeHour * 60 + wakeMinute;

  for (let i = 0; i < totalReminders; i++) {
    // Calculate hour and minute from total minutes
    let hour = Math.floor(currentMinutes / 60) % 24;
    let minute = currentMinutes % 60;

    // Check if we've passed sleep time (handle midnight crossing)
    const sleepMinutes = sleepHour * 60 + sleepMinute;
    const wakeMinutes = wakeHour * 60 + wakeMinute;
    
    // If sleep is before wake (crosses midnight), check differently
    if (sleepMinutes <= wakeMinutes) {
      // Sleep is next day
      const currentDayMinutes = currentMinutes % (24 * 60);
      if (currentDayMinutes > sleepMinutes && currentDayMinutes < wakeMinutes) {
        // We've passed sleep time, stop scheduling
        break;
      }
    } else {
      // Normal case: sleep is same day
      if (currentMinutes > sleepMinutes) {
        // We've passed sleep time, stop scheduling
        break;
      }
    }

    times.push({ hour, minute });

    // Move to next reminder time
    currentMinutes += intervalMinutes;
  }

  return times;
}

/**
 * Cancels all previously scheduled water reminder notifications
 * This should be called before scheduling new reminders to avoid duplicates
 */
export async function cancelAllWaterReminders(): Promise<void> {
  // Skip in Expo Go where notifications aren't fully supported
  if (isExpoGo()) {
    return;
  }

  try {
    if (!Notifications.getAllScheduledNotificationsAsync) {
      return;
    }

    // Get all scheduled notifications
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    // Cancel all notifications that match our water reminder prefix
    const cancelPromises = scheduledNotifications
      .filter((notification) => notification.identifier.startsWith(WATER_REMINDER_ID_PREFIX))
      .map((notification) =>
        Notifications.cancelScheduledNotificationAsync(notification.identifier)
      );

    await Promise.all(cancelPromises);
  } catch (error) {
    // Silently handle errors (expected in Expo Go)
    console.warn('Error canceling water reminders:', error);
  }
}

/**
 * Schedules water reminder notifications throughout the day
 * 
 * Business Logic:
 * 1. Calculates total reminders needed: totalMl / glassMl
 * 2. Calculates available time window between wake and sleep
 * 3. Schedules notifications evenly spaced across that window
 * 4. Each notification has sound enabled and mentions glass amount
 * 5. Notifications stop after sleep time
 * 
 * @param totalMl - Total daily water goal in milliliters (e.g., 3500)
 * @param glassMl - Amount of water per glass in milliliters (e.g., 250)
 * @param wakeTime - Wake time in HH:mm format (e.g., "07:00")
 * @param sleepTime - Sleep time in HH:mm format (e.g., "22:00")
 * @returns Promise<number> - Number of notifications successfully scheduled
 * @throws Error if inputs are invalid
 */
export async function scheduleWaterReminders(
  totalMl: number,
  glassMl: number,
  wakeTime: string,
  sleepTime: string
): Promise<number> {
  // Skip in Expo Go where notifications aren't fully supported
  if (isExpoGo()) {
    console.log('Notifications not available in Expo Go. Use a development build to schedule reminders.');
    return 0;
  }

  // Validate inputs
  if (totalMl <= 0) {
    throw new Error('Total daily water goal must be greater than 0');
  }

  if (glassMl <= 0) {
    throw new Error('Per-glass water amount must be greater than 0');
  }

  if (glassMl > totalMl) {
    throw new Error('Per-glass amount cannot be greater than total daily goal');
  }

  // Check permissions first
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    throw new Error('Notification permissions not granted. Please enable notifications in settings.');
  }

  // Parse times
  let wakeHour: number, wakeMinute: number;
  let sleepHour: number, sleepMinute: number;

  try {
    const wake = parseTime(wakeTime);
    wakeHour = wake.hour;
    wakeMinute = wake.minute;

    const sleep = parseTime(sleepTime);
    sleepHour = sleep.hour;
    sleepMinute = sleep.minute;
  } catch (error) {
    throw new Error(`Invalid time format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Calculate total reminders needed
  const totalReminders = Math.floor(totalMl / glassMl);

  // Handle edge case: zero reminders
  if (totalReminders === 0) {
    console.warn('No reminders to schedule: totalMl is less than glassMl');
    return 0;
  }

  // Cancel all existing water reminders first
  await cancelAllWaterReminders();

  // Calculate notification times
  const notificationTimes = calculateNotificationTimes(
    totalReminders,
    wakeHour,
    wakeMinute,
    sleepHour,
    sleepMinute
  );

  // Handle edge case: no valid times calculated
  if (notificationTimes.length === 0) {
    console.warn('No valid notification times calculated');
    return 0;
  }

  // Schedule notifications
  const schedulePromises = notificationTimes.map(async (time, index) => {
    try {
      const identifier = `${WATER_REMINDER_ID_PREFIX}${index + 1}`;

      // Use platform-specific trigger types
      // iOS: CALENDAR trigger (supports hour/minute with repeats)
      // Android: DAILY trigger (the correct way to schedule daily notifications)
      const trigger: Notifications.NotificationTriggerInput = Platform.OS === 'ios'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: time.hour,
            minute: time.minute,
            repeats: true,
          } as Notifications.CalendarTriggerInput
        : {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: time.hour,
            minute: time.minute,
          } as Notifications.DailyTriggerInput;

      // Get a different Hinglish message for each notification
      const messageIndex = index % HINGLISH_MESSAGES.length;
      const funnyMessage = HINGLISH_MESSAGES[messageIndex];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Paani Pi Le!',
          body: funnyMessage,
          sound: true, // Explicitly enable sound (NOT silent)
          data: {
            glassMl,
            reminderNumber: index + 1,
            totalReminders,
          },
        },
        trigger,
        identifier,
        // Android-specific: use our configured channel
        ...(Platform.OS === 'android' && {
          android: {
            channelId: WATER_REMINDER_CHANNEL_ID,
            sound: true, // Explicitly enable sound on Android
            vibrate: true, // Enable vibration
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
        }),
        // iOS-specific: ensure sound is enabled
        ...(Platform.OS === 'ios' && {
          sound: true, // Explicitly enable sound on iOS
        }),
      });
    } catch (error) {
      console.error(`Error scheduling notification ${index + 1}:`, error);
      // Continue scheduling other notifications even if one fails
    }
  });

  // Wait for all notifications to be scheduled
  await Promise.all(schedulePromises);

  return notificationTimes.length;
}

/**
 * Gets all scheduled water reminder notifications
 * Useful for debugging or displaying to users
 * 
 * @returns Promise<Array> - Array of scheduled notification objects
 */
export async function getScheduledWaterReminders(): Promise<
  Notifications.NotificationRequest[]
> {
  // Skip in Expo Go where notifications aren't fully supported
  if (isExpoGo()) {
    return [];
  }

  try {
    if (!Notifications.getAllScheduledNotificationsAsync) {
      return [];
    }

    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return allNotifications.filter((notification) =>
      notification.identifier.startsWith(WATER_REMINDER_ID_PREFIX)
    );
  } catch (error) {
    console.warn('Error getting scheduled water reminders:', error);
    return [];
  }
}

/**
 * Schedules a single water reminder notification
 * 
 * @param title - Notification title
 * @param body - Notification body text
 * @param seconds - Number of seconds from now to trigger the notification
 * @returns Promise<void>
 */
export async function scheduleWaterNotification({
  title,
  body,
  seconds,
}: {
  title: string;
  body: string;
  seconds: number;
}): Promise<void> {
  // Skip in Expo Go where notifications aren't fully supported
  if (isExpoGo()) {
    console.log('Notifications not available in Expo Go. Use a development build to schedule notifications.');
    return;
  }

  // Ensure channel is created first (Android)
  await createWaterReminderChannel();

  // Request permissions if needed
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    throw new Error('Notification permissions not granted');
  }

  try {
    if (!Notifications.scheduleNotificationAsync) {
      throw new Error('Notification scheduling not available');
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default', // 🔊 REQUIRED
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
      },
      // Android-specific: use our configured channel
      ...(Platform.OS === 'android' && {
        android: {
          channelId: 'water-reminder', // 🔥 IMPORTANT
          sound: 'default',
          vibrate: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
      }),
    });
  } catch (error) {
    console.error('Error scheduling water notification:', error);
    throw error;
  }
}
