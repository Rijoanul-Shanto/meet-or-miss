import { CONFIG } from './config';
import type { DedupeStore } from './dedupeStore';
import { logger } from './logger';
import type { MeetLinkExtractor } from './meetLinkExtractor';
import type { PropertiesStore } from './propertiesStore';
import type { MatchResult } from './types';
import type { WebhookClient } from './webhookClient';

export class EventProcessor {
  constructor(
    private readonly props: PropertiesStore,
    private readonly dedupe: DedupeStore,
    private readonly meetLink: MeetLinkExtractor,
    private readonly webhook: WebhookClient,
  ) {}

  process(
    event: GoogleAppsScript.Calendar.CalendarEvent,
    windowStart: Date,
    windowEnd: Date,
    minutesAhead: number,
  ): void {
    const startTime = event.getStartTime();
    const startMs = startTime.getTime();

    // Half-open window [start, end) — prevents adjacent-trigger double-counting.
    if (startMs < windowStart.getTime() || startMs >= windowEnd.getTime()) return;

    const title = event.getTitle() || 'Untitled Event';
    const match = this.matchTargets(title, event.getCreators());
    if (!match.isTitleMatch && !match.isCreatorMatch) return;

    const eventId = event.getId();
    if (this.dedupe.hasFired(eventId, startTime, minutesAhead)) {
      logger.debug('Already alerted', { title, minutesAhead });
      return;
    }

    const meetLink = this.meetLink.extract(event);
    if (!meetLink) {
      logger.warn('No Meet link found; skipping', { title });
      return;
    }

    const urls = this.props.getWebhookUrls();
    const channel = match.isTitleMatch ? 'title' : 'creator';
    const target = match.isTitleMatch ? urls.titleWebhookUrl : urls.creatorWebhookUrl;

    if (!target) {
      logger.error('Webhook URL missing for matched route', { channel });
      return;
    }

    const sent = this.webhook.send(target, { title, startTime, meetLink, minutesAhead });
    if (sent) this.dedupe.markFired(eventId, startTime, minutesAhead);
  }

  private matchTargets(title: string, creators: string[]): MatchResult {
    const cleanTitle = title.trim().toLowerCase();
    const cleanCreators = creators.map((e) => e.trim().toLowerCase());
    return {
      isTitleMatch: CONFIG.targetTitles.includes(cleanTitle),
      isCreatorMatch: CONFIG.targetCreators.some((c) => cleanCreators.includes(c)),
    };
  }
}
