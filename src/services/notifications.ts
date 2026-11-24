export interface ExtractedEventTime {
  rawMatch: string;
  hours: number; // 0 - 23
  minutes: number;
  displayTime: string; // e.g. "2:00 PM"
}

/**
 * Intelligent parser that extracts event times from natural user input
 * Examples:
 * - "I have interview at 2 pm" -> 14:00 (2:00 PM)
 * - "Doctor appointment at 10:30 am" -> 10:30 AM
 * - "Call team at 4pm" -> 16:00 (4:00 PM)
 */
export function extractTimeFromText(text: string): ExtractedEventTime | null {
  if (!text) return null;

  // 1. Match 12-hour formats: "at 2 pm", "2:00 pm", "2:30pm", "at 11 am", etc.
  const regex12h = /(?:(?:at|by|from)\s+)?\b([0-1]?[0-9])(?::([0-5][0-9]))?\s*(am|pm)\b/i;
  const match12 = text.match(regex12h);

  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const meridian = match12[3].toLowerCase();

    if (hours > 12) return null;
    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;

    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    const displayMeridian = hours >= 12 ? 'PM' : 'AM';

    return {
      rawMatch: match12[0],
      hours,
      minutes,
      displayTime: `${displayHours}:${displayMinutes} ${displayMeridian}`,
    };
  }

  // 2. Match 24-hour formats preceded by "at": "at 14:00", "at 09:30"
  const regex24h = /(?:(?:at|by)\s+)\b([0-2]?[0-9]):([0-5][0-9])\b/i;
  const match24 = text.match(regex24h);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours >= 0 && hours <= 23) {
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      const displayMeridian = hours >= 12 ? 'PM' : 'AM';
      return {
        rawMatch: match24[0],
        hours,
        minutes,
        displayTime: `${displayHours}:${displayMinutes} ${displayMeridian}`,
      };
    }
  }

  return null;
}

export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const displayHours = hours % 12 || 12;
  const meridian = hours >= 12 ? 'PM' : 'AM';
  return `${displayHours}:${minutes} ${meridian}`;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') return true;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

export async function scheduleWebReminder({
  title,
  entryDate,
  eventTime,
  offsetMinutes = 30,
}: {
  title: string;
  entryDate: string; // "YYYY-MM-DD"
  eventTime: ExtractedEventTime;
  offsetMinutes?: number;
}): Promise<{ reminderDate: Date } | null> {
  const granted = await requestNotificationPermission();

  const [year, month, day] = entryDate.split('-').map(Number);
  const eventDate = new Date(year, month - 1, day, eventTime.hours, eventTime.minutes, 0);
  const reminderDate = new Date(eventDate.getTime() - offsetMinutes * 60 * 1000);
  const now = new Date();

  const delayMs = reminderDate.getTime() - now.getTime();
  if (delayMs <= 0) {
    return null; // past
  }

  // Schedule browser notification if granted
  if (granted && delayMs < 2147483647) {
    setTimeout(() => {
      new Notification(`Reminder: ${title}`, {
        body: `Your scheduled event starts in ${offsetMinutes} minutes at ${eventTime.displayTime}.`,
        icon: '/favicon.ico',
      });
    }, delayMs);
  }

  return { reminderDate };
}
