import { CONFIG, PROPERTY_KEYS } from './config';
import { logger } from './logger';
import type { PropertiesStore } from './propertiesStore';

export class DedupeStore {
  constructor(private readonly store: PropertiesStore) {}

  hasFired(eventId: string, startTime: Date, minutesAhead: number): boolean {
    return this.store.get(this.buildKey(eventId, startTime, minutesAhead)) !== null;
  }

  markFired(eventId: string, startTime: Date, minutesAhead: number): void {
    this.store.set(this.buildKey(eventId, startTime, minutesAhead), '1');
  }

  pruneOlderThan(cutoffMs: number = Date.now() - CONFIG.dedupeTtlMs): number {
    const all = this.store.getAll();
    const stale: string[] = [];

    for (const key of Object.keys(all)) {
      if (!key.startsWith(PROPERTY_KEYS.dedupePrefix)) continue;
      const parts = key.split('_');
      const ts = Number(parts[1]);
      if (Number.isFinite(ts) && ts < cutoffMs) stale.push(key);
    }

    stale.forEach((k) => this.store.delete(k));
    if (stale.length > 0) {
      logger.info('Pruned dedupe keys', { count: stale.length });
    }
    return stale.length;
  }

  private buildKey(eventId: string, startTime: Date, minutesAhead: number): string {
    return `${PROPERTY_KEYS.dedupePrefix}${startTime.getTime()}_${minutesAhead}_${eventId}`;
  }
}
