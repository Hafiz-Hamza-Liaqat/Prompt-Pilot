import { describe, expect, it } from 'vitest';
import {
  addReviewDueDate,
  DEFAULT_REVIEW_INTERVAL_DAYS,
  getFreshnessState,
  isRecommendationEligibleLifecycle,
  REVIEW_DUE_SOON_DAYS,
} from '../../src/domain/providerCatalogue.js';

const VERIFIED_AT = '2026-07-04T12:00:00+00:00';
const REVIEW_DUE_AT = '2026-08-03T12:00:00+00:00';

describe('addReviewDueDate', () => {
  it('adds the default 30-day review interval', () => {
    const verified = new Date(VERIFIED_AT);
    const reviewDue = addReviewDueDate(verified);

    expect(reviewDue.toISOString()).toBe(new Date(REVIEW_DUE_AT).toISOString());
    expect(DEFAULT_REVIEW_INTERVAL_DAYS).toBe(30);
  });

  it('supports custom review intervals without mutating the verification date', () => {
    const verified = new Date(VERIFIED_AT);
    const reviewDue = addReviewDueDate(verified, 14);

    expect(reviewDue.getUTCDate()).toBe(18);
    expect(verified.toISOString()).toBe(new Date(VERIFIED_AT).toISOString());
  });
});

describe('getFreshnessState', () => {
  it('returns fresh when review is more than seven days away', () => {
    const now = new Date('2026-07-04T12:00:00+00:00');

    expect(getFreshnessState(VERIFIED_AT, REVIEW_DUE_AT, now)).toBe('fresh');
    expect(REVIEW_DUE_SOON_DAYS).toBe(7);
  });

  it('returns due_soon inside the seven-day review window', () => {
    const reviewDueAt = '2026-07-08T12:00:00+00:00';
    const now = new Date('2026-07-04T12:00:00+00:00');

    expect(getFreshnessState(VERIFIED_AT, reviewDueAt, now)).toBe('due_soon');
  });

  it('returns overdue after the review due date', () => {
    const reviewDueAt = '2026-07-01T12:00:00+00:00';
    const now = new Date('2026-07-04T12:00:00+00:00');

    expect(getFreshnessState(VERIFIED_AT, reviewDueAt, now)).toBe('overdue');
  });

  it('accepts Date objects for review due timestamps', () => {
    const now = new Date('2026-07-04T12:00:00+00:00');
    const reviewDue = new Date(REVIEW_DUE_AT);

    expect(getFreshnessState(new Date(VERIFIED_AT), reviewDue, now)).toBe('fresh');
  });
});

describe('isRecommendationEligibleLifecycle', () => {
  it('allows active, preview, limited, and unknown lifecycle states', () => {
    expect(isRecommendationEligibleLifecycle('active')).toBe(true);
    expect(isRecommendationEligibleLifecycle('preview')).toBe(true);
    expect(isRecommendationEligibleLifecycle('limited')).toBe(true);
    expect(isRecommendationEligibleLifecycle('unknown')).toBe(true);
  });

  it('blocks sunsetting, deprecated, and unavailable lifecycle states', () => {
    expect(isRecommendationEligibleLifecycle('sunsetting')).toBe(false);
    expect(isRecommendationEligibleLifecycle('deprecated')).toBe(false);
    expect(isRecommendationEligibleLifecycle('unavailable')).toBe(false);
  });
});
