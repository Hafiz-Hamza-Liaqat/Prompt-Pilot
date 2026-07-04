import { describe, expect, it, vi } from 'vitest';
import * as complexityRiskDomain from '../../src/domain/complexityRiskAssessment.js';
import { decomposeDurationIntoScenes } from '../../src/domain/sceneDecomposition.js';
import { createDefaultProductionRequirements } from '../../src/domain/productionRequirements.js';
import type { PartialVideoBriefDraft } from '../../src/domain/videoBriefDraft.js';
import {
  assessCompletedBriefComplexityRisk,
  assessComplexityRisk,
  createComplexityRiskService,
} from '../../src/server/scoring/complexity-risk-service.js';

const COMPLETED_AT = '2026-07-04T12:00:00+00:00';

function buildBrief(overrides: Partial<PartialVideoBriefDraft> = {}): PartialVideoBriefDraft {
  return {
    id: '44444444-4444-4444-4444-444444444444',
    projectId: '33333333-3333-3333-3333-333333333333',
    sourceType: 'idea',
    sourceText: 'A compelling summer product launch concept with secret brief text.',
    sourceUrl: 'https://example.com/product-page',
    workingTitle: 'Summer Launch',
    objective: 'Showcase the new product line.',
    targetAudience: 'Urban professionals',
    publishingDestination: 'youtube',
    aspectRatio: '16:9',
    videoCategory: 'product_advertisement',
    durationSeconds: 30,
    visualStyle: 'Cinematic',
    tone: 'Upbeat',
    productionRequirements: createDefaultProductionRequirements(),
    budgetPriority: 'balanced',
    qualityPriority: 'highest_quality',
    userConstraints: null,
    completedAt: COMPLETED_AT,
    createdAt: COMPLETED_AT,
    updatedAt: COMPLETED_AT,
    ...overrides,
  };
}

function buildBriefInput(overrides: Partial<PartialVideoBriefDraft> = {}) {
  const brief = buildBrief(overrides);
  return {
    completedAt: brief.completedAt,
    durationSeconds: brief.durationSeconds,
    sourceType: brief.sourceType,
    userConstraints: brief.userConstraints ?? null,
    productionRequirements: brief.productionRequirements,
  };
}

function matchingDecomposition(durationSeconds: number) {
  return decomposeDurationIntoScenes(durationSeconds);
}

describe('ComplexityRiskService', () => {
  const service = createComplexityRiskService();

  it('1. completed brief and matching decomposition succeed', () => {
    const brief = buildBrief();
    const decomposition = matchingDecomposition(30);
    const result = service.assessCompletedBriefComplexityRisk(brief, decomposition);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.algorithmVersion).toBe('complexity-risk-v1');
      expect(result.data.origin).toBe('deterministic_rule_engine');
    }
  });

  it('2. draft brief returns brief_required', () => {
    const result = assessCompletedBriefComplexityRisk(
      buildBrief({ completedAt: null }),
      matchingDecomposition(30),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('brief_required');
    }
  });

  it('3. missing completed_at returns brief_required', () => {
    const result = assessComplexityRisk(
      buildBriefInput({ completedAt: undefined }),
      matchingDecomposition(30),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('brief_required');
    }
  });

  it('4. duration mismatch is rejected', () => {
    const result = assessCompletedBriefComplexityRisk(
      buildBrief({ durationSeconds: 30 }),
      matchingDecomposition(60),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('duration_mismatch');
    }
  });

  it('5. low-complexity brief produces low or moderate complexity', () => {
    const result = assessCompletedBriefComplexityRisk(
      buildBrief({
        durationSeconds: 10,
        sourceType: 'idea',
        productionRequirements: createDefaultProductionRequirements(),
        userConstraints: null,
      }),
      matchingDecomposition(10),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(['low', 'moderate']).toContain(result.data.complexity.level);
    }
  });

  it('6. requirement-heavy brief produces a higher complexity score', () => {
    const minimal = assessCompletedBriefComplexityRisk(
      buildBrief({
        durationSeconds: 30,
        productionRequirements: createDefaultProductionRequirements(),
      }),
      matchingDecomposition(30),
    );
    const heavy = assessCompletedBriefComplexityRisk(
      buildBrief({
        durationSeconds: 30,
        productionRequirements: {
          ...createDefaultProductionRequirements(),
          characterConsistency: true,
          lipSync: true,
          exactTextVisibility: true,
          logoAccuracy: true,
          multipleLocations: true,
          cameraControl: true,
        },
      }),
      matchingDecomposition(30),
    );

    expect(minimal.ok).toBe(true);
    expect(heavy.ok).toBe(true);
    if (minimal.ok && heavy.ok) {
      expect(heavy.data.complexity.score).toBeGreaterThan(minimal.data.complexity.score);
    }
  });

  it('7. high-fidelity combinations increase execution risk', () => {
    const baseline = assessCompletedBriefComplexityRisk(
      buildBrief({
        durationSeconds: 30,
        productionRequirements: createDefaultProductionRequirements(),
      }),
      matchingDecomposition(30),
    );
    const highFidelity = assessCompletedBriefComplexityRisk(
      buildBrief({
        durationSeconds: 30,
        productionRequirements: {
          ...createDefaultProductionRequirements(),
          exactTextVisibility: true,
          logoAccuracy: true,
          dialogue: true,
          lipSync: true,
        },
      }),
      matchingDecomposition(30),
    );

    expect(baseline.ok).toBe(true);
    expect(highFidelity.ok).toBe(true);
    if (baseline.ok && highFidelity.ok) {
      expect(highFidelity.data.executionRisk.rawScore).toBeGreaterThan(
        baseline.data.executionRisk.rawScore,
      );
    }
  });

  it('8. score contributions remain explainable', () => {
    const result = assessCompletedBriefComplexityRisk(
      buildBrief({
        productionRequirements: {
          ...createDefaultProductionRequirements(),
          voiceover: true,
        },
      }),
      matchingDecomposition(30),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const factor of result.data.complexity.contributions) {
        expect(factor.label.trim().length).toBeGreaterThan(0);
        expect(factor.rationale.trim().length).toBeGreaterThan(0);
        expect(factor.points).toBeGreaterThan(0);
        expect(factor.sourceFields.length).toBeGreaterThan(0);
      }
      for (const factor of result.data.executionRisk.contributions) {
        expect(factor.label.trim().length).toBeGreaterThan(0);
        expect(factor.rationale.trim().length).toBeGreaterThan(0);
        expect(factor.points).toBeGreaterThan(0);
        expect(factor.sourceFields.length).toBeGreaterThan(0);
      }
    }
  });

  it('9. provider dependency is absent', () => {
    const source = createComplexityRiskService.toString();
    expect(source).not.toContain('provider');
    expect(source).not.toContain('catalogue');
  });

  it('10. provider catalogue is not read', () => {
    const source = createComplexityRiskService.toString();
    expect(source).not.toContain('ProviderCatalogue');
    expect(source).not.toContain('ai_video_providers');
  });

  it('11. no repository mutation occurs', () => {
    const source = createComplexityRiskService.toString();
    expect(source).not.toContain('repository');
    expect(source).not.toContain('.insert(');
    expect(source).not.toContain('.update(');
    expect(source).not.toContain('.delete(');
  });

  it('12. no external request occurs', () => {
    const source = createComplexityRiskService.toString();
    expect(source).not.toContain('fetch(');
  });

  it('13. output is deterministic', () => {
    const brief = buildBrief({
      productionRequirements: {
        ...createDefaultProductionRequirements(),
        dialogue: true,
        voiceover: true,
      },
    });
    const decomposition = matchingDecomposition(30);
    const first = assessCompletedBriefComplexityRisk(brief, decomposition);
    const second = assessCompletedBriefComplexityRisk(brief, decomposition);
    expect(first).toEqual(second);
  });

  it('14. input is not mutated', () => {
    const brief = buildBrief({
      productionRequirements: {
        ...createDefaultProductionRequirements(),
        referenceImages: true,
      },
    });
    const snapshot = structuredClone(brief);
    assessCompletedBriefComplexityRisk(brief, matchingDecomposition(30));
    expect(brief).toEqual(snapshot);
  });

  it('15. scene decomposition is not mutated', () => {
    const decomposition = matchingDecomposition(30);
    const snapshot = structuredClone(decomposition);
    assessCompletedBriefComplexityRisk(buildBrief(), decomposition);
    expect(decomposition).toEqual(snapshot);
  });

  it('16. source URL is not fetched', () => {
    const source = createComplexityRiskService.toString();
    expect(source).not.toContain('sourceUrl');
    expect(source).not.toContain('fetch(');
  });

  it('17. free text is not semantically analyzed', () => {
    const constraintLength = 100;
    const neutral = assessCompletedBriefComplexityRisk(
      buildBrief({ userConstraints: 'A'.repeat(constraintLength) }),
      matchingDecomposition(30),
    );
    const alternateMeaning = assessCompletedBriefComplexityRisk(
      buildBrief({
        userConstraints:
          'Violence luxury comedy medical claims urgency premium discount hero close-up tone mood'.slice(
            0,
            constraintLength,
          ).padEnd(constraintLength, 'x'),
      }),
      matchingDecomposition(30),
    );

    expect(neutral.ok).toBe(true);
    expect(alternateMeaning.ok).toBe(true);
    if (neutral.ok && alternateMeaning.ok) {
      expect(alternateMeaning.data.complexity.score).toBe(neutral.data.complexity.score);
      expect(alternateMeaning.data.executionRisk.score).toBe(neutral.data.executionRisk.score);
    }
  });

  it('18. raw brief text is not copied into output', () => {
    const secretText = 'SECRET_BRIEF_TEXT_SHOULD_NOT_APPEAR_IN_OUTPUT';
    const result = assessCompletedBriefComplexityRisk(
      buildBrief({ sourceText: secretText }),
      matchingDecomposition(30),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const serialized = JSON.stringify(result.data);
      expect(serialized).not.toContain(secretText);
    }
  });

  it('19. domain errors map safely', () => {
    const spy = vi
      .spyOn(complexityRiskDomain, 'calculateComplexityRiskAssessment')
      .mockImplementation(() => {
        throw new Error('forced domain failure');
      });

    const result = assessCompletedBriefComplexityRisk(buildBrief(), matchingDecomposition(30));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('assessment_error');
    }

    spy.mockRestore();
  });

  it('20. no recommendation field is returned', () => {
    const result = assessCompletedBriefComplexityRisk(buildBrief(), matchingDecomposition(30));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('recommendedProvider');
      expect(result.data).not.toHaveProperty('providerScore');
      expect(result.data).not.toHaveProperty('matchPercentage');
    }
  });

  it('21. no quality score is returned', () => {
    const result = assessCompletedBriefComplexityRisk(buildBrief(), matchingDecomposition(30));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('qualityScore');
    }
  });

  it('22. no success probability is returned', () => {
    const result = assessCompletedBriefComplexityRisk(buildBrief(), matchingDecomposition(30));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('successProbability');
      expect(result.data).not.toHaveProperty('failureProbability');
    }
  });
});

describe('ComplexityRiskService invalid input handling', () => {
  it('returns invalid_input for unsupported source type', () => {
    const brief = buildBriefInput({});
    const result = assessComplexityRisk(
      { ...brief, sourceType: 'unsupported_source' as typeof brief.sourceType },
      matchingDecomposition(30),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('invalid_input');
    }
  });
});
