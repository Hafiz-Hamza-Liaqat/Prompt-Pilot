import { describe, expect, it } from 'vitest';
import {
  PRODUCTION_REQUIREMENT_CAPABILITY_MAPPING,
  buildProviderCapabilityNeeds,
  deriveMaximumSceneDurationFromDecomposition,
} from '../../src/domain/providerRequirementMapping.js';
import {
  PRODUCTION_REQUIREMENT_KEYS,
  createDefaultProductionRequirements,
} from '../../src/domain/productionRequirements.js';
import { decomposeDurationIntoScenes } from '../../src/domain/sceneDecomposition.js';

const BASE_INPUT = {
  sourceType: 'idea' as const,
  aspectRatio: '16:9' as const,
  durationSeconds: 30,
  sceneDecomposition: decomposeDurationIntoScenes(30),
  productionRequirements: createDefaultProductionRequirements(),
};

describe('buildProviderCapabilityNeeds', () => {
  it('1. text-to-video need always exists', () => {
    const needs = buildProviderCapabilityNeeds(BASE_INPUT);
    const textToVideo = needs.find((need) => need.key === 'primary_text_to_video');
    expect(textToVideo).toBeDefined();
    expect(textToVideo?.capabilityKey).toBe('text_to_video');
    expect(textToVideo?.importance).toBe('critical');
    expect(textToVideo?.weight).toBe(20);
  });

  it('2. aspect-ratio need always exists', () => {
    const needs = buildProviderCapabilityNeeds(BASE_INPUT);
    const aspectRatio = needs.find((need) => need.key === 'requested_aspect_ratio');
    expect(aspectRatio).toBeDefined();
    expect(aspectRatio?.capabilityKey).toBe('supported_aspect_ratios');
    expect(aspectRatio?.importance).toBe('required');
    expect(aspectRatio?.weight).toBe(10);
  });

  it('3. maximum-scene-duration need always exists', () => {
    const needs = buildProviderCapabilityNeeds(BASE_INPUT);
    const durationNeed = needs.find((need) => need.key === 'maximum_scene_duration');
    expect(durationNeed).toBeDefined();
    expect(durationNeed?.capabilityKey).toBe('max_duration_seconds');
    expect(durationNeed?.importance).toBe('required');
    expect(durationNeed?.weight).toBe(10);
  });

  it('4. maximum scene duration is derived correctly', () => {
    const decomposition = decomposeDurationIntoScenes(45);
    const needs = buildProviderCapabilityNeeds({
      ...BASE_INPUT,
      durationSeconds: 45,
      sceneDecomposition: decomposition,
    });
    const expectedMax = deriveMaximumSceneDurationFromDecomposition(decomposition);
    const durationNeed = needs.find((need) => need.key === 'maximum_scene_duration');
    expect(expectedMax).toBeGreaterThan(0);
    expect(durationNeed?.rationale).toContain(`${expectedMax} seconds`);
  });

  it('5. disabled production requirements create no needs', () => {
    const needs = buildProviderCapabilityNeeds(BASE_INPUT);
    const requirementNeeds = needs.filter((need) => need.category === 'production_requirement');
    expect(requirementNeeds).toHaveLength(0);
  });

  it('6. every enabled requirement creates its mapped need', () => {
    const productionRequirements = createDefaultProductionRequirements();
    for (const key of PRODUCTION_REQUIREMENT_KEYS) {
      productionRequirements[key] = true;
    }

    const needs = buildProviderCapabilityNeeds({
      ...BASE_INPUT,
      productionRequirements,
    });

    for (const key of PRODUCTION_REQUIREMENT_KEYS) {
      if (key === 'firstLastFrameControl') {
        expect(needs.some((need) => need.key === 'first_frame_control')).toBe(true);
        expect(needs.some((need) => need.key === 'last_frame_control')).toBe(true);
        continue;
      }

      const mapping = PRODUCTION_REQUIREMENT_CAPABILITY_MAPPING[key];
      expect(needs.some((need) => need.capabilityKey === mapping.capabilityKeys[0])).toBe(true);
    }
  });

  it('7. first/last-frame control creates exactly two needs', () => {
    const needs = buildProviderCapabilityNeeds({
      ...BASE_INPUT,
      productionRequirements: {
        ...createDefaultProductionRequirements(),
        firstLastFrameControl: true,
      },
    });

    const frameNeeds = needs.filter(
      (need) => need.key === 'first_frame_control' || need.key === 'last_frame_control',
    );
    expect(frameNeeds).toHaveLength(2);
  });

  it('8. all 14 canonical requirement keys are mapped', () => {
    expect(Object.keys(PRODUCTION_REQUIREMENT_CAPABILITY_MAPPING)).toHaveLength(14);
    for (const key of PRODUCTION_REQUIREMENT_KEYS) {
      expect(PRODUCTION_REQUIREMENT_CAPABILITY_MAPPING[key]).toBeDefined();
    }
  });

  it('9. no extra requirement key exists', () => {
    const mappingKeys = Object.keys(PRODUCTION_REQUIREMENT_CAPABILITY_MAPPING);
    expect(mappingKeys.sort()).toEqual([...PRODUCTION_REQUIREMENT_KEYS].sort());
  });

  it('10. need keys are unique', () => {
    const needs = buildProviderCapabilityNeeds({
      ...BASE_INPUT,
      productionRequirements: Object.fromEntries(
        PRODUCTION_REQUIREMENT_KEYS.map((key) => [key, true]),
      ) as ReturnType<typeof createDefaultProductionRequirements>,
    });
    const keys = needs.map((need) => need.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('11. need order is deterministic', () => {
    const productionRequirements = {
      ...createDefaultProductionRequirements(),
      lipSync: true,
      voiceover: true,
      cameraControl: true,
    };

    const first = buildProviderCapabilityNeeds({ ...BASE_INPUT, productionRequirements });
    const second = buildProviderCapabilityNeeds({ ...BASE_INPUT, productionRequirements });
    expect(first.map((need) => need.key)).toEqual(second.map((need) => need.key));
    expect(first.map((need) => need.key)[0]).toBe('primary_text_to_video');
    expect(first.map((need) => need.key)[1]).toBe('requested_aspect_ratio');
    expect(first.map((need) => need.key)[2]).toBe('maximum_scene_duration');
  });

  it('12. need weights are positive', () => {
    const needs = buildProviderCapabilityNeeds({
      ...BASE_INPUT,
      productionRequirements: Object.fromEntries(
        PRODUCTION_REQUIREMENT_KEYS.map((key) => [key, true]),
      ) as ReturnType<typeof createDefaultProductionRequirements>,
    });
    for (const need of needs) {
      expect(need.weight).toBeGreaterThan(0);
      expect(Number.isInteger(need.weight)).toBe(true);
    }
  });

  it('13. source fields are approved', () => {
    const approvedFields = new Set([
      'sourceType',
      'aspectRatio',
      'durationSeconds',
      'sceneDecomposition',
      'productionRequirements',
    ]);
    const needs = buildProviderCapabilityNeeds({
      ...BASE_INPUT,
      productionRequirements: {
        ...createDefaultProductionRequirements(),
        dialogue: true,
      },
    });

    for (const need of needs) {
      for (const field of need.sourceFields) {
        expect(approvedFields.has(field)).toBe(true);
      }
    }
  });

  it('14. no provider ID appears', () => {
    const needs = buildProviderCapabilityNeeds(BASE_INPUT);
    const serialized = JSON.stringify(needs);
    expect(serialized).not.toContain('google_veo');
    expect(serialized).not.toContain('openai_sora');
    expect(serialized).not.toContain('runway');
    expect(serialized).not.toContain('providerId');
  });

  it('15. no source text appears', () => {
    const needs = buildProviderCapabilityNeeds(BASE_INPUT);
    for (const need of needs) {
      expect(need.rationale).not.toContain('SECRET');
      expect(need.label).not.toContain('user script');
    }
  });

  it('16. no source URL value appears in rationale', () => {
    const needs = buildProviderCapabilityNeeds(BASE_INPUT);
    for (const need of needs) {
      expect(need.rationale).not.toMatch(/https?:\/\//);
    }
  });

  it('17. input is not mutated', () => {
    const input = {
      ...BASE_INPUT,
      productionRequirements: createDefaultProductionRequirements(),
    };
    const snapshot = structuredClone(input);
    buildProviderCapabilityNeeds(input);
    expect(input).toEqual(snapshot);
  });
});
