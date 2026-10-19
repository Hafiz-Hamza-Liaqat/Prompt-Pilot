import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CLEANUP_POLICY,
  DEFAULT_EXPIRATION_POLICY,
  isAssetEligibleForCleanup,
  isAssetExpired,
  resolveExpirationTimestamp,
} from '../../src/domain/media/lifecycle/index.js';
import { buildAssetExpiredEvent } from '../../src/domain/media/lifecycle/events.js';

describe('media lifecycle contracts', () => {
  it('resolves expiration timestamps from policy', () => {
    const expiresAt = resolveExpirationTimestamp('2026-07-05T12:00:00.000Z', DEFAULT_EXPIRATION_POLICY);
    expect(Date.parse(expiresAt)).toBeGreaterThan(Date.parse('2026-07-05T12:00:00.000Z'));
  });

  it('detects expired assets', () => {
    expect(
      isAssetExpired(
        {
          assetId: 'asset-001',
          state: 'active',
          createdAt: '2026-07-03T12:00:00.000Z',
          expiresAt: '2026-07-04T12:00:00.000Z',
        },
        '2026-07-05T12:00:00.000Z',
      ),
    ).toBe(true);
  });

  it('honours cleanup policy grace, max age, and orphan rules', () => {
    const now = '2026-07-05T14:00:00.000Z';
    const base = {
      assetId: 'asset-001',
      state: 'active' as const,
      createdAt: '2026-07-03T12:00:00.000Z',
      expiresAt: '2026-07-04T12:00:00.000Z',
    };

    expect(isAssetEligibleForCleanup(base, DEFAULT_CLEANUP_POLICY, now)).toBe(true);

    expect(
      isAssetEligibleForCleanup(
        { ...base, jobTerminalAt: '2026-07-05T13:30:00.000Z' },
        DEFAULT_CLEANUP_POLICY,
        now,
      ),
    ).toBe(false);

    expect(
      isAssetEligibleForCleanup(
        { ...base, isOrphan: true },
        { ...DEFAULT_CLEANUP_POLICY, purgeOrphans: false },
        now,
      ),
    ).toBe(false);
  });

  it('defines cleanup policy defaults', () => {
    expect(DEFAULT_CLEANUP_POLICY.purgeOrphans).toBe(true);
    expect(DEFAULT_CLEANUP_POLICY.tempAssetMaxAgeHours).toBeGreaterThan(0);
  });

  it('builds asset expired lifecycle events', () => {
    const event = buildAssetExpiredEvent({
      projectId: 'project-001',
      ownerId: 'owner-001',
      assetId: 'asset-001',
      occurredAt: '2026-07-05T12:00:00.000Z',
    });
    expect(event.eventType).toBe('asset_expired');
    expect(event.assetState).toBe('expired');
  });
});
