import { MEET_LINK_REGEX } from './config';
import { logger } from './logger';

export class MeetLinkExtractor {
  extract(event: GoogleAppsScript.Calendar.CalendarEvent): string | null {
    const calendarId = event.getOriginalCalendarId() || 'primary';

    const fromApi = this.fromAdvancedApi(event.getId(), calendarId);
    if (fromApi) return fromApi;

    const fromLocation = this.matchUrl(event.getLocation());
    if (fromLocation) return fromLocation;

    const fromDescription = this.matchUrl(event.getDescription());
    if (fromDescription) return fromDescription;

    return null;
  }

  private fromAdvancedApi(eventId: string, calendarId: string): string | null {
    try {
      const cleanId = eventId.replace('@google.com', '');
      const raw = Calendar.Events!.get(calendarId, cleanId);
      const entries = raw.conferenceData?.entryPoints ?? [];
      const video = entries.find((e) => e.entryPointType === 'video');
      return video?.uri ?? null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn('Conference data fetch failed', { eventId, calendarId, message });
      return null;
    }
  }

  private matchUrl(text: string | null | undefined): string | null {
    if (!text) return null;
    const match = text.match(MEET_LINK_REGEX);
    return match ? match[0] : null;
  }
}
