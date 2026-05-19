export interface AppConfig {
  readonly notifyMinutesBefore: readonly number[];
  readonly targetTitles: readonly string[];
  readonly targetCreators: readonly string[];
  readonly searchWindowMs: number;
  readonly dedupeTtlMs: number;
}

export interface WebhookUrls {
  readonly titleWebhookUrl: string | null;
  readonly creatorWebhookUrl: string | null;
}

export interface MatchResult {
  readonly isTitleMatch: boolean;
  readonly isCreatorMatch: boolean;
}

export interface NotificationContext {
  readonly title: string;
  readonly startTime: Date;
  readonly meetLink: string;
  readonly minutesAhead: number;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;
