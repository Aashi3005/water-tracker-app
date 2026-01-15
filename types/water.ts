export interface WaterData {
  entries: Record<string, number>; // date string -> amount in ml
  goal: number; // daily goal in ml
  reminderInterval?: number; // reminder interval in minutes
  wakeTime?: string; // wake time in HH:mm format (e.g., "07:00")
  sleepTime?: string; // sleep time in HH:mm format (e.g., "22:00")
}

export interface WaterEntry {
  date: string;
  amount: number;
}

