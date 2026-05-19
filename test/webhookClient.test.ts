import { describe, expect, it, type Mock } from 'bun:test';

import { WebhookClient } from '../src/webhookClient';

type AnyMock = Mock<(...args: unknown[]) => unknown>;
const fetchMock = (): AnyMock => UrlFetchApp.fetch as unknown as AnyMock;
const sleepMock = (): AnyMock => Utilities.sleep as unknown as AnyMock;

function mockResponse(code: number, body = ''): GoogleAppsScript.URL_Fetch.HTTPResponse {
  return {
    getResponseCode: () => code,
    getContentText: () => body,
  } as GoogleAppsScript.URL_Fetch.HTTPResponse;
}

describe('WebhookClient', () => {
  const ctx = {
    title: 'Test Meeting',
    startTime: new Date('2026-01-01T10:00:00Z'),
    meetLink: 'https://meet.google.com/abc-defg-hij',
    minutesAhead: 5,
  };

  it('returns true on 2xx', () => {
    fetchMock().mockReset().mockReturnValueOnce(mockResponse(204));
    const client = new WebhookClient();
    expect(client.send('https://discord.test', ctx)).toBe(true);
    expect(fetchMock()).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 then succeeds', () => {
    fetchMock()
      .mockReset()
      .mockReturnValueOnce(mockResponse(429))
      .mockReturnValueOnce(mockResponse(204));
    sleepMock().mockReset();
    const client = new WebhookClient({ maxRetries: 3, baseBackoffMs: 1 });
    expect(client.send('https://discord.test', ctx)).toBe(true);
    expect(fetchMock()).toHaveBeenCalledTimes(2);
    expect(sleepMock()).toHaveBeenCalledTimes(1);
  });

  it('retries on 5xx', () => {
    fetchMock()
      .mockReset()
      .mockReturnValueOnce(mockResponse(503))
      .mockReturnValueOnce(mockResponse(502))
      .mockReturnValueOnce(mockResponse(200));
    const client = new WebhookClient({ maxRetries: 3, baseBackoffMs: 1 });
    expect(client.send('https://discord.test', ctx)).toBe(true);
    expect(fetchMock()).toHaveBeenCalledTimes(3);
  });

  it('does not retry on 4xx (other than 429)', () => {
    fetchMock().mockReset().mockReturnValueOnce(mockResponse(404, 'not found'));
    const client = new WebhookClient({ maxRetries: 3, baseBackoffMs: 1 });
    expect(client.send('https://discord.test', ctx)).toBe(false);
    expect(fetchMock()).toHaveBeenCalledTimes(1);
  });

  it('retries on network errors', () => {
    fetchMock()
      .mockReset()
      .mockImplementationOnce(() => {
        throw new Error('socket hang up');
      })
      .mockReturnValueOnce(mockResponse(204));
    const client = new WebhookClient({ maxRetries: 3, baseBackoffMs: 1 });
    expect(client.send('https://discord.test', ctx)).toBe(true);
  });

  it('returns false after exhausting retries', () => {
    fetchMock().mockReset().mockReturnValue(mockResponse(503));
    const client = new WebhookClient({ maxRetries: 2, baseBackoffMs: 1 });
    expect(client.send('https://discord.test', ctx)).toBe(false);
    expect(fetchMock()).toHaveBeenCalledTimes(2);
  });
});
