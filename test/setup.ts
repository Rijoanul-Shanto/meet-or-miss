import { mock } from 'bun:test';

// Stub Google Apps Script globals so source modules can be imported under bun:test.
// Individual tests override these mocks with mockReturnValue / mockImplementation.

interface MutableGlobal {
  PropertiesService: unknown;
  CalendarApp: unknown;
  UrlFetchApp: unknown;
  Calendar: unknown;
  Utilities: unknown;
}

const g = globalThis as unknown as MutableGlobal;

g.PropertiesService = {
  getScriptProperties: mock(() => ({
    getProperty: mock(() => null),
    setProperty: mock(() => undefined),
    deleteProperty: mock(() => undefined),
    getProperties: mock(() => ({})),
  })),
};

g.CalendarApp = {
  getAllCalendars: mock(() => []),
  getDefaultCalendar: mock(() => undefined),
};

g.UrlFetchApp = {
  fetch: mock(() => undefined),
};

g.Calendar = {
  Events: { get: mock(() => undefined) },
  CalendarList: { list: mock(() => undefined) },
};

g.Utilities = {
  sleep: mock(() => undefined),
};

export {};
