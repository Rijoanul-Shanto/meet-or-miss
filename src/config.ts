import type { AppConfig } from './types';

export const CONFIG: AppConfig = {
  notifyMinutesBefore: [0, 5, 10],
  targetTitles: [
    'the round-up meeting',
    'tuesday pulse check',
    'kickoff meeting',
  ],
  targetCreators: ['rijoanul.shanto@gmail.com'],
  searchWindowMs: 30_000,
  dedupeTtlMs: 24 * 60 * 60 * 1000,
};

export const MEET_LINK_REGEX = /https:\/\/meet\.google\.com\/[a-z0-9-]+/;

export const DISCORD_EMBED_COLORS = {
  blurple: 5814783,
  red: 15158332,
  green: 5763719,
} as const;

export const PROPERTY_KEYS = {
  titleWebhook: 'TITLE_WEBHOOK_URL',
  creatorWebhook: 'CREATOR_WEBHOOK_URL',
  dedupePrefix: 'sent_',
} as const;
