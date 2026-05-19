import { describe, expect, it } from 'bun:test';

import { DedupeStore } from '../src/dedupeStore';

import { makePropertiesStore } from './helpers';

describe('DedupeStore', () => {
  const startTime = new Date('2026-01-01T10:00:00Z');
  const eventId = 'evt_abc@google.com';

  it('returns false before marking', () => {
    const store = makePropertiesStore();
    const dedupe = new DedupeStore(store);
    expect(dedupe.hasFired(eventId, startTime, 5)).toBe(false);
  });

  it('returns true after marking', () => {
    const store = makePropertiesStore();
    const dedupe = new DedupeStore(store);
    dedupe.markFired(eventId, startTime, 5);
    expect(dedupe.hasFired(eventId, startTime, 5)).toBe(true);
  });

  it('treats different minutesAhead as separate keys', () => {
    const store = makePropertiesStore();
    const dedupe = new DedupeStore(store);
    dedupe.markFired(eventId, startTime, 5);
    expect(dedupe.hasFired(eventId, startTime, 10)).toBe(false);
  });

  it('prunes keys older than cutoff', () => {
    const store = makePropertiesStore();
    const dedupe = new DedupeStore(store);
    const oldTime = new Date('2025-01-01T10:00:00Z');
    const recentTime = new Date('2026-01-01T10:00:00Z');

    dedupe.markFired('old', oldTime, 5);
    dedupe.markFired('recent', recentTime, 5);

    const removed = dedupe.pruneOlderThan(new Date('2025-06-01').getTime());

    expect(removed).toBe(1);
    expect(dedupe.hasFired('old', oldTime, 5)).toBe(false);
    expect(dedupe.hasFired('recent', recentTime, 5)).toBe(true);
  });

  it('ignores non-dedupe keys during prune', () => {
    const store = makePropertiesStore();
    store.set('TITLE_WEBHOOK_URL', 'https://example.com');
    const dedupe = new DedupeStore(store);

    const removed = dedupe.pruneOlderThan(Date.now() + 1000);

    expect(removed).toBe(0);
    expect(store.get('TITLE_WEBHOOK_URL')).toBe('https://example.com');
  });
});
