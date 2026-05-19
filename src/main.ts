import { CalendarService } from './calendarService';
import { CONFIG } from './config';
import { DedupeStore } from './dedupeStore';
import { EventProcessor } from './eventProcessor';
import { logger } from './logger';
import { MeetLinkExtractor } from './meetLinkExtractor';
import { PropertiesStore } from './propertiesStore';
import { WebhookClient } from './webhookClient';

export function checkUpcomingMeetings(): void {
  logger.info('Run started');
  const startedAt = Date.now();

  const props = new PropertiesStore();
  const dedupe = new DedupeStore(props);
  const meetLink = new MeetLinkExtractor();
  const webhook = new WebhookClient();
  const calendar = new CalendarService();
  const processor = new EventProcessor(props, dedupe, meetLink, webhook);

  try {
    const now = new Date();
    now.setSeconds(0, 0); // snap to top of minute to absorb trigger jitter

    for (const minutesAhead of CONFIG.notifyMinutesBefore) {
      const target = new Date(now.getTime() + minutesAhead * 60_000);
      const windowStart = new Date(target.getTime() - CONFIG.searchWindowMs);
      const windowEnd = new Date(target.getTime() + CONFIG.searchWindowMs);

      logger.debug('Window scan', {
        minutesAhead,
        from: windowStart.toISOString(),
        to: windowEnd.toISOString(),
      });

      const events = calendar.getEventsInWindow(windowStart, windowEnd);
      for (const event of events) {
        processor.process(event, windowStart, windowEnd, minutesAhead);
      }
    }

    dedupe.pruneOlderThan();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error('Run failed', { message, stack });
  }

  logger.info('Run finished', { durationMs: Date.now() - startedAt });
}
