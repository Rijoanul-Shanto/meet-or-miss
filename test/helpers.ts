import { PropertiesStore } from '../src/propertiesStore';

export class FakePropertiesService implements GoogleAppsScript.Properties.Properties {
  private readonly store = new Map<string, string>();

  getProperty(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setProperty(key: string, value: string): GoogleAppsScript.Properties.Properties {
    this.store.set(key, value);
    return this;
  }

  deleteProperty(key: string): GoogleAppsScript.Properties.Properties {
    this.store.delete(key);
    return this;
  }

  getProperties(): Record<string, string> {
    return Object.fromEntries(this.store);
  }

  // Unused parts of the interface — stubbed.
  getKeys(): string[] {
    return Array.from(this.store.keys());
  }

  setProperties(
    properties: Record<string, string>,
  ): GoogleAppsScript.Properties.Properties {
    for (const [k, v] of Object.entries(properties)) this.store.set(k, v);
    return this;
  }

  deleteAllProperties(): GoogleAppsScript.Properties.Properties {
    this.store.clear();
    return this;
  }
}

export function makePropertiesStore(): PropertiesStore {
  return new PropertiesStore(new FakePropertiesService());
}

export function makeFakeEvent(overrides: Partial<FakeEventInit> = {}): FakeEvent {
  return new FakeEvent({
    id: 'evt_123@google.com',
    title: 'Untitled',
    creators: [],
    location: '',
    description: '',
    calendarId: 'primary',
    startTime: new Date('2026-01-01T10:00:00Z'),
    ...overrides,
  });
}

interface FakeEventInit {
  id: string;
  title: string;
  creators: string[];
  location: string;
  description: string;
  calendarId: string;
  startTime: Date;
}

export class FakeEvent {
  constructor(private readonly init: FakeEventInit) {}

  getId(): string {
    return this.init.id;
  }
  getTitle(): string {
    return this.init.title;
  }
  getCreators(): string[] {
    return this.init.creators;
  }
  getLocation(): string {
    return this.init.location;
  }
  getDescription(): string {
    return this.init.description;
  }
  getOriginalCalendarId(): string {
    return this.init.calendarId;
  }
  getStartTime(): Date {
    return this.init.startTime;
  }
}
