import { describe, expect, it } from 'vitest';
import {
  buildStageCompletedEvent,
  buildStageEnteredEvent,
  isPersistableJobEventType,
} from '../../src/domain/job/events.js';

describe('job lifecycle events', () => {
  it('builds stage entered and completed events', () => {
    const entered = buildStageEnteredEvent('analyzing', '2026-07-05T12:00:00.000Z');
    expect(entered.eventType).toBe('stage_entered');
    expect(entered.stage).toBe('analyzing');

    const completed = buildStageCompletedEvent('analyzing', '2026-07-05T12:05:00.000Z');
    expect(completed.eventType).toBe('stage_completed');
  });

  it('distinguishes persistable audit events from lifecycle-only events', () => {
    expect(isPersistableJobEventType('checkpoint')).toBe(true);
    expect(isPersistableJobEventType('retry_scheduled')).toBe(false);
  });
});
