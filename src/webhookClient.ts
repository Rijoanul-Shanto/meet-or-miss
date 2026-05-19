import { DISCORD_EMBED_COLORS } from './config';
import { logger } from './logger';
import type { NotificationContext } from './types';

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
}

interface DiscordPayload {
  embeds: DiscordEmbed[];
}

interface WebhookStyle {
  color: number;
  timeMessage: string;
}

export class WebhookClient {
  private readonly maxRetries: number;
  private readonly baseBackoffMs: number;

  constructor(options?: { maxRetries?: number; baseBackoffMs?: number }) {
    this.maxRetries = options?.maxRetries ?? 3;
    this.baseBackoffMs = options?.baseBackoffMs ?? 500;
  }

  send(url: string, ctx: NotificationContext): boolean {
    const payload = this.buildPayload(ctx);
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const result = this.tryOnce(url, options, attempt, ctx);
      if (result === 'success') return true;
      if (result === 'permanent-failure') return false;
      if (attempt < this.maxRetries) Utilities.sleep(this.backoff(attempt));
    }

    logger.error('Webhook gave up after retries', {
      title: ctx.title,
      attempts: this.maxRetries,
    });
    return false;
  }

  private tryOnce(
    url: string,
    options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions,
    attempt: number,
    ctx: NotificationContext,
  ): 'success' | 'retryable' | 'permanent-failure' {
    try {
      const response = UrlFetchApp.fetch(url, options);
      const code = response.getResponseCode();

      if (code >= 200 && code < 300) {
        logger.info('Webhook delivered', {
          title: ctx.title,
          minutesAhead: ctx.minutesAhead,
          attempt,
        });
        return 'success';
      }

      if (code === 429 || code >= 500) {
        logger.warn('Webhook retryable error', { code, attempt });
        return 'retryable';
      }

      logger.error('Webhook permanent error', {
        code,
        body: response.getContentText(),
      });
      return 'permanent-failure';
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn('Webhook network error', { attempt, message });
      return 'retryable';
    }
  }

  private backoff(attempt: number): number {
    return this.baseBackoffMs * 2 ** (attempt - 1);
  }

  private buildPayload(ctx: NotificationContext): DiscordPayload {
    const { title, startTime, meetLink, minutesAhead } = ctx;
    const { color, timeMessage } = this.styleFor(minutesAhead);

    return {
      embeds: [
        {
          title: `📅 ${title}`,
          description:
            `${timeMessage}\n` +
            `**Time:** ${startTime.toLocaleTimeString()}\n\n` +
            `🔗 **[Click here to join the Meeting](${meetLink})**`,
          color,
        },
      ],
    };
  }

  private styleFor(minutesAhead: number): WebhookStyle {
    if (minutesAhead === 0) {
      return {
        color: DISCORD_EMBED_COLORS.green,
        timeMessage: '**Status:** 🟢 STARTED NOW!',
      };
    }
    if (minutesAhead <= 5) {
      return {
        color: DISCORD_EMBED_COLORS.red,
        timeMessage: `**Starts in:** ${minutesAhead} minutes!`,
      };
    }
    return {
      color: DISCORD_EMBED_COLORS.blurple,
      timeMessage: `**Starts in:** ${minutesAhead} minutes!`,
    };
  }
}
