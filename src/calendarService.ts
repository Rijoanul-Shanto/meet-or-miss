import { logger } from './logger';

export class CalendarService {
  getEventsInWindow(start: Date, end: Date): GoogleAppsScript.Calendar.CalendarEvent[] {
    const calendars = CalendarApp.getAllCalendars();
    const events: GoogleAppsScript.Calendar.CalendarEvent[] = [];

    for (const cal of calendars) {
      try {
        cal.getEvents(start, end).forEach((e) => events.push(e));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn('Calendar read failed', { calendar: cal.getName(), message });
      }
    }

    return events;
  }
}
