import { describe, expect, it } from 'vitest';
import {
  ORCHESTRATION_DEFERRED_EVENT_TYPES,
  ORCHESTRATION_EMITTED_EVENT_TYPES,
  ORCHESTRATION_EVENT_TYPES,
} from '../../src/domain/orchestration/index.js';

describe('orchestration event contract alignment', () => {
  it('partitions all event types into emitted and deferred sets', () => {
    const union = [...ORCHESTRATION_EMITTED_EVENT_TYPES, ...ORCHESTRATION_DEFERRED_EVENT_TYPES].sort();
    const all = [...ORCHESTRATION_EVENT_TYPES].sort();
    expect(union).toEqual(all);
  });

  it('defers timeout_scheduled to worker boundary only', () => {
    expect(ORCHESTRATION_DEFERRED_EVENT_TYPES).toEqual(['timeout_scheduled']);
    expect(ORCHESTRATION_EMITTED_EVENT_TYPES).not.toContain('timeout_scheduled');
  });
});
