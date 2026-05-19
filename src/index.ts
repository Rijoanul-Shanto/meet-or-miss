// Bundle entrypoint. Bun.build wraps everything in an IIFE; we attach our
// public functions onto globalThis so the post-build footer can expose them
// as top-level declarations that Apps Script triggers can discover.

import { checkUpcomingMeetings } from './main';
import { healthCheck } from './healthCheck';

const g = globalThis as Record<string, unknown>;
g.__meetingsReminder_check = checkUpcomingMeetings;
g.__meetingsReminder_health = healthCheck;
