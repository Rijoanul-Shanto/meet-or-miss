import { CONFIG } from './config';
import { logger } from './logger';
import { PropertiesStore } from './propertiesStore';

export function healthCheck(): boolean {
  logger.info('Health check started');
  let ok = true;

  const props = new PropertiesStore();
  const urls = props.getWebhookUrls();

  if (!urls.titleWebhookUrl) {
    logger.error('TITLE_WEBHOOK_URL not set in Script Properties');
    ok = false;
  }
  if (!urls.creatorWebhookUrl) {
    logger.error('CREATOR_WEBHOOK_URL not set in Script Properties');
    ok = false;
  }

  try {
    const cal = CalendarApp.getDefaultCalendar();
    logger.info('CalendarApp reachable', { default: cal.getName() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('CalendarApp unreachable', { message });
    ok = false;
  }

  try {
    Calendar.CalendarList!.list();
    logger.info('Advanced Calendar service reachable');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Advanced Calendar service unavailable', { message });
    ok = false;
  }

  logger.info('Health check finished', {
    ok,
    targetTitles: CONFIG.targetTitles.length,
    targetCreators: CONFIG.targetCreators.length,
    alertOffsets: CONFIG.notifyMinutesBefore,
  });
  return ok;
}
