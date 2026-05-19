import type { LogContext, LogLevel } from './types';

function format(level: LogLevel, message: string, context?: LogContext): string {
  const ts = new Date().toISOString();
  const ctx = context ? ` ${JSON.stringify(context)}` : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${ctx}`;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    console.log(format('debug', message, context));
  },
  info(message: string, context?: LogContext): void {
    console.log(format('info', message, context));
  },
  warn(message: string, context?: LogContext): void {
    console.warn(format('warn', message, context));
  },
  error(message: string, context?: LogContext): void {
    console.error(format('error', message, context));
  },
};
