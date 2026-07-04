import { describe, expect, it } from 'vitest';
import {
  WORKSPACE_SECTIONS,
  WORKSPACE_SAMPLE_DISCLAIMER,
} from '../../src/domain/mockResultWorkspace.js';
import {
  buildWorkspaceSectionHref,
  EVALUATION_STATE_LABELS,
  resultWorkspaceSections,
  WORKSPACE_CATALOGUE_REFERENCE_LABEL,
  WORKSPACE_INTERFACE_PREVIEW_LABEL,
  WORKSPACE_SAMPLE_BADGE_LABEL,
  WORKSPACE_SECTION_DESCRIPTIONS,
  WORKSPACE_SECTION_LABELS,
  WORKSPACE_TRUTHFULNESS_NOTICES,
} from '../../src/config/result-workspace.js';

const PROJECT_ID = '33333333-3333-3333-3333-333333333333';

describe('result workspace configuration', () => {
  it('defines seven workspace sections', () => {
    expect(resultWorkspaceSections).toHaveLength(7);
    expect(Object.keys(WORKSPACE_SECTION_LABELS)).toHaveLength(7);
  });

  it('matches domain section order', () => {
    expect(resultWorkspaceSections.map((section) => section.value)).toEqual([
      ...WORKSPACE_SECTIONS,
    ]);
  });

  it('uses non-empty section labels and descriptions', () => {
    for (const section of resultWorkspaceSections) {
      expect(section.label.trim().length).toBeGreaterThan(0);
      expect(section.description.trim().length).toBeGreaterThan(0);
      expect(WORKSPACE_SECTION_DESCRIPTIONS[section.value].trim().length).toBeGreaterThan(0);
    }
  });

  it('builds functional local section hrefs', () => {
    expect(buildWorkspaceSectionHref(PROJECT_ID, 'overview')).toBe(
      `/projects/${PROJECT_ID}/workspace`,
    );
    expect(buildWorkspaceSectionHref(PROJECT_ID, 'scenes')).toBe(
      `/projects/${PROJECT_ID}/workspace?section=scenes`,
    );
  });

  it('does not expose empty hrefs', () => {
    for (const section of WORKSPACE_SECTIONS) {
      const href = buildWorkspaceSectionHref(PROJECT_ID, section);
      expect(href.trim().length).toBeGreaterThan(0);
    }
  });

  it('does not use hash placeholder links', () => {
    for (const section of WORKSPACE_SECTIONS) {
      const href = buildWorkspaceSectionHref(PROJECT_ID, section);
      expect(href).not.toBe('#');
      expect(href).not.toContain('#');
    }
  });

  it('includes the sample disclaimer notice', () => {
    expect(WORKSPACE_TRUTHFULNESS_NOTICES.sampleDisclaimer).toBe(WORKSPACE_SAMPLE_DISCLAIMER);
    expect(WORKSPACE_TRUTHFULNESS_NOTICES.sampleDisclaimer.trim().length).toBeGreaterThan(0);
  });

  it('states provider section is not recommendation output', () => {
    expect(WORKSPACE_SECTION_DESCRIPTIONS.providers.toLowerCase()).toContain('not recommendations');
    expect(WORKSPACE_TRUTHFULNESS_NOTICES.providerPanelLabel.toLowerCase()).toContain(
      'not recommendations',
    );
  });

  it('references Phase 9 or future scene decomposition', () => {
    expect(WORKSPACE_SECTION_DESCRIPTIONS.scenes.toLowerCase()).toContain('phase 9');
    expect(WORKSPACE_TRUTHFULNESS_NOTICES.sceneFutureNotice.toLowerCase()).toContain('phase 9');
  });

  it('states prompt compilation is inactive', () => {
    expect(WORKSPACE_SECTION_DESCRIPTIONS.prompts.toLowerCase()).toContain('not active');
    expect(WORKSPACE_TRUTHFULNESS_NOTICES.promptInactiveNotice.toLowerCase()).toContain(
      'not active',
    );
  });

  it('states quality evaluation is inactive', () => {
    expect(WORKSPACE_SECTION_DESCRIPTIONS.quality.toLowerCase()).toContain('not implemented');
    expect(WORKSPACE_TRUTHFULNESS_NOTICES.qualityInactiveNotice.toLowerCase()).toContain(
      'not implemented',
    );
  });

  it('contains no ranking language', () => {
    const serialized = JSON.stringify({
      sections: resultWorkspaceSections,
      notices: WORKSPACE_TRUTHFULNESS_NOTICES,
    }).toLowerCase();

    expect(serialized).not.toMatch(/\brank(ed|ing)?\b/);
    expect(serialized).not.toMatch(/\b#1 provider\b/);
  });

  it('contains no best provider language', () => {
    const serialized = JSON.stringify({
      sections: resultWorkspaceSections,
      notices: WORKSPACE_TRUTHFULNESS_NOTICES,
    }).toLowerCase();

    expect(serialized).not.toMatch(/\bbest provider\b/);
    expect(serialized).not.toMatch(/\bwinning provider\b/);
  });

  it('contains no match-percentage language', () => {
    const serialized = JSON.stringify({
      sections: resultWorkspaceSections,
      notices: WORKSPACE_TRUTHFULNESS_NOTICES,
    }).toLowerCase();

    expect(serialized).not.toContain('match percentage');
    expect(serialized).not.toContain('matchpercentage');
  });

  it('contains no affirmative media generation claims', () => {
    const labels = [
      ...resultWorkspaceSections.flatMap((section) => [section.label, section.description]),
      ...Object.values(WORKSPACE_TRUTHFULNESS_NOTICES),
      WORKSPACE_SAMPLE_BADGE_LABEL,
      WORKSPACE_INTERFACE_PREVIEW_LABEL,
      WORKSPACE_CATALOGUE_REFERENCE_LABEL,
      ...Object.values(EVALUATION_STATE_LABELS),
    ]
      .join(' ')
      .toLowerCase();

    expect(labels).not.toMatch(/\bgenerate (a )?video\b/);
    expect(labels).not.toMatch(/\bcreate video\b/);
    expect(labels).not.toMatch(/\brender video\b/);
  });

  it('contains no retired product names', () => {
    const serialized = JSON.stringify({
      sections: resultWorkspaceSections,
      notices: WORKSPACE_TRUTHFULNESS_NOTICES,
      labels: WORKSPACE_SECTION_LABELS,
    }).toLowerCase();

    expect(serialized).not.toContain('prompt pilot pro');
    expect(serialized).not.toContain('video pilot');
    expect(serialized).not.toContain('ai video generator');
  });
});
