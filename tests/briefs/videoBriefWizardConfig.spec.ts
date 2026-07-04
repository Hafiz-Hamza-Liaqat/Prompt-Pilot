import { describe, expect, it } from 'vitest';
import {
  ASPECT_RATIOS,
  BUDGET_PRIORITIES,
  DURATION_PRESETS_SECONDS,
  PUBLISHING_DESTINATIONS,
  QUALITY_PRIORITIES,
  VIDEO_CATEGORIES,
} from '@/domain/constants';
import { WIZARD_SOURCE_TYPES, WIZARD_STEPS } from '@/domain/videoBriefDraft';
import {
  ASPECT_RATIO_OPTIONS,
  BUDGET_PRIORITY_OPTIONS,
  CATEGORY_OPTIONS,
  DESTINATION_OPTIONS,
  DURATION_PRESET_OPTIONS,
  PRODUCTION_REQUIREMENT_OPTIONS,
  QUALITY_PRIORITY_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  WIZARD_STEP_CONFIG,
} from '@/config/video-brief-wizard';

describe('video brief wizard configuration', () => {
  it('defines nine wizard steps', () => {
    expect(WIZARD_STEP_CONFIG).toHaveLength(9);
  });

  it('matches domain step order', () => {
    expect(WIZARD_STEP_CONFIG.map((step) => step.value)).toEqual([...WIZARD_STEPS]);
  });

  it('lists exactly four supported source options', () => {
    expect(SOURCE_TYPE_OPTIONS).toHaveLength(4);
    expect(SOURCE_TYPE_OPTIONS.map((option) => option.value)).toEqual([...WIZARD_SOURCE_TYPES]);
  });

  it('does not expose a template source option', () => {
    const values = SOURCE_TYPE_OPTIONS.map((option) => option.value);
    expect(values).not.toContain('template');
  });

  it('matches authoritative publishing destinations', () => {
    expect(DESTINATION_OPTIONS.map((option) => option.value)).toEqual([
      ...PUBLISHING_DESTINATIONS,
    ]);
  });

  it('matches authoritative video categories', () => {
    expect(CATEGORY_OPTIONS.map((option) => option.value)).toEqual([...VIDEO_CATEGORIES]);
  });

  it('matches authoritative duration presets', () => {
    expect(DURATION_PRESET_OPTIONS.map((option) => Number(option.value))).toEqual([
      ...DURATION_PRESETS_SECONDS,
    ]);
  });

  it('uses unique priority labels', () => {
    const budgetLabels = BUDGET_PRIORITY_OPTIONS.map((option) => option.label);
    const qualityLabels = QUALITY_PRIORITY_OPTIONS.map((option) => option.label);

    expect(new Set(budgetLabels).size).toBe(BUDGET_PRIORITIES.length);
    expect(new Set(qualityLabels).size).toBe(QUALITY_PRIORITIES.length);
  });

  it('labels every production requirement boolean', () => {
    expect(PRODUCTION_REQUIREMENT_OPTIONS).toHaveLength(14);
    expect(PRODUCTION_REQUIREMENT_OPTIONS.every((option) => option.label.trim().length > 0)).toBe(
      true,
    );
  });

  it('does not contain retired product names', () => {
    const serialized = JSON.stringify({
      steps: WIZARD_STEP_CONFIG,
      sources: SOURCE_TYPE_OPTIONS,
      destinations: DESTINATION_OPTIONS,
    }).toLowerCase();

    expect(serialized).not.toContain('promptpilot');
    expect(serialized).not.toContain('prompt pilot pro');
  });

  it('does not claim media generation in wizard copy', () => {
    const labels = [
      ...WIZARD_STEP_CONFIG.flatMap((step) => [step.label, step.description]),
      ...SOURCE_TYPE_OPTIONS.map((option) => option.label),
      ...DESTINATION_OPTIONS.map((option) => option.label),
      ...CATEGORY_OPTIONS.map((option) => option.label),
      ...BUDGET_PRIORITY_OPTIONS.map((option) => option.label),
      ...QUALITY_PRIORITY_OPTIONS.map((option) => option.label),
      ...PRODUCTION_REQUIREMENT_OPTIONS.map((option) => option.label),
    ]
      .join(' ')
      .toLowerCase();

    expect(labels).not.toMatch(/\bgenerate (a )?video\b/);
    expect(labels).not.toMatch(/\bcreate video\b/);
    expect(labels).not.toMatch(/\brender video\b/);
    expect(ASPECT_RATIO_OPTIONS.map((option) => option.value)).toEqual([...ASPECT_RATIOS]);
  });
});
