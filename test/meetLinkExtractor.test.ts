import { beforeEach, describe, expect, it, type Mock } from 'bun:test';

import { MeetLinkExtractor } from '../src/meetLinkExtractor';

import { makeFakeEvent } from './helpers';

describe('MeetLinkExtractor', () => {
  const extractor = new MeetLinkExtractor();
  const getMock = (): Mock<(...args: unknown[]) => unknown> =>
    Calendar.Events!.get as unknown as Mock<(...args: unknown[]) => unknown>;

  beforeEach(() => {
    getMock().mockReset();
  });

  it('returns conference data URI when advanced API succeeds', () => {
    getMock().mockReturnValue({
      conferenceData: {
        entryPoints: [
          { entryPointType: 'video', uri: 'https://meet.google.com/abc-defg-hij' },
          { entryPointType: 'phone', uri: 'tel:+1234' },
        ],
      },
    });
    const event = makeFakeEvent();
    expect(extractor.extract(event as never)).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('falls back to location when advanced API has no video entry', () => {
    getMock().mockReturnValue({ conferenceData: null });
    const event = makeFakeEvent({
      location: 'Office or https://meet.google.com/xyz-pqrs-tuv',
    });
    expect(extractor.extract(event as never)).toBe('https://meet.google.com/xyz-pqrs-tuv');
  });

  it('falls back to description when location empty', () => {
    getMock().mockReturnValue({ conferenceData: null });
    const event = makeFakeEvent({
      location: '',
      description: 'Join here: https://meet.google.com/lmn-opqr-stu',
    });
    expect(extractor.extract(event as never)).toBe('https://meet.google.com/lmn-opqr-stu');
  });

  it('returns null when no source has a Meet link', () => {
    getMock().mockReturnValue({ conferenceData: null });
    const event = makeFakeEvent({ location: 'Office', description: 'No link here' });
    expect(extractor.extract(event as never)).toBeNull();
  });

  it('swallows advanced API errors and falls through', () => {
    getMock().mockImplementation(() => {
      throw new Error('Not authorized');
    });
    const event = makeFakeEvent({
      description: 'https://meet.google.com/aaa-bbbb-ccc',
    });
    expect(extractor.extract(event as never)).toBe('https://meet.google.com/aaa-bbbb-ccc');
  });
});
