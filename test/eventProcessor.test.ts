import { describe, expect, it, mock, spyOn, type Mock } from 'bun:test';

import { PROPERTY_KEYS } from '../src/config';
import { DedupeStore } from '../src/dedupeStore';
import { EventProcessor } from '../src/eventProcessor';
import { MeetLinkExtractor } from '../src/meetLinkExtractor';
import { PropertiesStore } from '../src/propertiesStore';
import { WebhookClient } from '../src/webhookClient';

import { FakePropertiesService, makeFakeEvent } from './helpers';

interface BuildResult {
  processor: EventProcessor;
  webhookSend: Mock<(url: string, ctx: unknown) => boolean>;
  dedupe: DedupeStore;
  props: PropertiesStore;
}

function buildProcessor(opts: {
  meetLink?: string | null;
  titleUrl?: string;
  creatorUrl?: string;
  sendResult?: boolean;
} = {}): BuildResult {
  const fake = new FakePropertiesService();
  if (opts.titleUrl !== undefined) fake.setProperty(PROPERTY_KEYS.titleWebhook, opts.titleUrl);
  if (opts.creatorUrl !== undefined) fake.setProperty(PROPERTY_KEYS.creatorWebhook, opts.creatorUrl);
  const props = new PropertiesStore(fake);

  const dedupe = new DedupeStore(props);
  const meetLink = new MeetLinkExtractor();
  spyOn(meetLink, 'extract').mockReturnValue(opts.meetLink ?? 'https://meet.google.com/x-y-z');

  const webhook = new WebhookClient();
  const webhookSend = mock((_url: string, _ctx: unknown) => opts.sendResult ?? true);
  (webhook as unknown as { send: typeof webhookSend }).send = webhookSend;

  return {
    processor: new EventProcessor(props, dedupe, meetLink, webhook),
    webhookSend,
    dedupe,
    props,
  };
}

const baseStart = new Date('2026-01-01T10:00:00Z');
const windowStart = new Date(baseStart.getTime() - 30_000);
const windowEnd = new Date(baseStart.getTime() + 30_000);

describe('EventProcessor', () => {
  describe('window enforcement', () => {
    it('ignores events starting before window', () => {
      const { processor, webhookSend } = buildProcessor({ titleUrl: 'https://t' });
      const event = makeFakeEvent({
        title: 'the round-up meeting',
        startTime: new Date(windowStart.getTime() - 1),
      });
      processor.process(event as never, windowStart, windowEnd, 0);
      expect(webhookSend).not.toHaveBeenCalled();
    });

    it('ignores events starting at window end (half-open)', () => {
      const { processor, webhookSend } = buildProcessor({ titleUrl: 'https://t' });
      const event = makeFakeEvent({
        title: 'the round-up meeting',
        startTime: new Date(windowEnd.getTime()),
      });
      processor.process(event as never, windowStart, windowEnd, 0);
      expect(webhookSend).not.toHaveBeenCalled();
    });

    it('accepts events starting at window start (half-open)', () => {
      const { processor, webhookSend } = buildProcessor({ titleUrl: 'https://t' });
      const event = makeFakeEvent({
        title: 'the round-up meeting',
        startTime: windowStart,
      });
      processor.process(event as never, windowStart, windowEnd, 0);
      expect(webhookSend).toHaveBeenCalled();
    });
  });

  describe('routing', () => {
    it('routes title match to title webhook', () => {
      const { processor, webhookSend } = buildProcessor({
        titleUrl: 'https://title',
        creatorUrl: 'https://creator',
      });
      const event = makeFakeEvent({
        title: 'the round-up meeting',
        startTime: baseStart,
      });
      processor.process(event as never, windowStart, windowEnd, 5);
      expect(webhookSend).toHaveBeenCalledTimes(1);
      const call = webhookSend.mock.calls[0]!;
      expect(call[0]).toBe('https://title');
    });

    it('routes creator-only match to creator webhook', () => {
      const { processor, webhookSend } = buildProcessor({
        titleUrl: 'https://title',
        creatorUrl: 'https://creator',
      });
      const event = makeFakeEvent({
        title: 'Random meeting',
        creators: ['rijoanul.shanto@gmail.com'],
        startTime: baseStart,
      });
      processor.process(event as never, windowStart, windowEnd, 5);
      expect(webhookSend.mock.calls[0]![0]).toBe('https://creator');
    });

    it('title match wins over dual match', () => {
      const { processor, webhookSend } = buildProcessor({
        titleUrl: 'https://title',
        creatorUrl: 'https://creator',
      });
      const event = makeFakeEvent({
        title: 'the round-up meeting',
        creators: ['rijoanul.shanto@gmail.com'],
        startTime: baseStart,
      });
      processor.process(event as never, windowStart, windowEnd, 5);
      expect(webhookSend).toHaveBeenCalledTimes(1);
      expect(webhookSend.mock.calls[0]![0]).toBe('https://title');
    });

    it('skips when matched route URL is missing', () => {
      const { processor, webhookSend } = buildProcessor({ creatorUrl: 'https://c' });
      const event = makeFakeEvent({
        title: 'the round-up meeting',
        startTime: baseStart,
      });
      processor.process(event as never, windowStart, windowEnd, 5);
      expect(webhookSend).not.toHaveBeenCalled();
    });
  });

  describe('dedupe', () => {
    it('marks fired on successful send', () => {
      const { processor, dedupe } = buildProcessor({ titleUrl: 'https://t' });
      const event = makeFakeEvent({
        title: 'the round-up meeting',
        startTime: baseStart,
      });
      processor.process(event as never, windowStart, windowEnd, 5);
      expect(dedupe.hasFired(event.getId(), baseStart, 5)).toBe(true);
    });

    it('does not mark fired on failed send', () => {
      const { processor, dedupe } = buildProcessor({ titleUrl: 'https://t', sendResult: false });
      const event = makeFakeEvent({
        title: 'the round-up meeting',
        startTime: baseStart,
      });
      processor.process(event as never, windowStart, windowEnd, 5);
      expect(dedupe.hasFired(event.getId(), baseStart, 5)).toBe(false);
    });

    it('skips already-fired event', () => {
      const { processor, dedupe, webhookSend } = buildProcessor({ titleUrl: 'https://t' });
      const event = makeFakeEvent({
        title: 'the round-up meeting',
        startTime: baseStart,
      });
      dedupe.markFired(event.getId(), baseStart, 5);
      processor.process(event as never, windowStart, windowEnd, 5);
      expect(webhookSend).not.toHaveBeenCalled();
    });
  });

  describe('non-matching events', () => {
    it('ignores events with no title or creator match', () => {
      const { processor, webhookSend } = buildProcessor({ titleUrl: 'https://t' });
      const event = makeFakeEvent({ title: 'Random', startTime: baseStart });
      processor.process(event as never, windowStart, windowEnd, 5);
      expect(webhookSend).not.toHaveBeenCalled();
    });

    it('skips matched event with no Meet link', () => {
      const { processor, webhookSend } = buildProcessor({
        titleUrl: 'https://t',
        meetLink: null,
      });
      const event = makeFakeEvent({
        title: 'the round-up meeting',
        startTime: baseStart,
      });
      processor.process(event as never, windowStart, windowEnd, 5);
      expect(webhookSend).not.toHaveBeenCalled();
    });
  });
});
