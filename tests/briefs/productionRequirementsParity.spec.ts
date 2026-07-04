import { describe, expect, it } from 'vitest';
import { siteConfig } from '@/config/site';
import {
  PRODUCTION_REQUIREMENT_FIELDS,
  PRODUCTION_REQUIREMENT_OPTIONS,
} from '@/config/video-brief-wizard';
import {
  PRODUCTION_REQUIREMENT_COUNT,
  PRODUCTION_REQUIREMENT_DB_COLUMNS,
  PRODUCTION_REQUIREMENT_DB_COLUMN_NAMES,
  PRODUCTION_REQUIREMENT_KEYS,
  PRODUCTION_REQUIREMENT_LABELS,
  ProductionRequirementsSchema,
  createDefaultProductionRequirements,
  mapProductionRequirementsFromDb,
  mapProductionRequirementsToDb,
  parseProductionRequirementCheckbox,
} from '@/domain/productionRequirements';
import { ProductionRequirementsSchema as VideoBriefRequirementsSchema } from '@/domain/videoBrief';
import { ProductionRequirementsSchema as WizardRequirementsSchema } from '@/domain/videoBriefDraft';

describe('production requirement contract parity', () => {
  it('canonical requirement count is exactly 14', () => {
    expect(PRODUCTION_REQUIREMENT_COUNT).toBe(14);
    expect(PRODUCTION_REQUIREMENT_KEYS).toHaveLength(14);
  });

  it('canonical keys are unique', () => {
    expect(new Set(PRODUCTION_REQUIREMENT_KEYS).size).toBe(14);
  });

  it('canonical schema contains exactly the approved keys', () => {
    expect(Object.keys(ProductionRequirementsSchema.shape).sort()).toEqual(
      [...PRODUCTION_REQUIREMENT_KEYS].sort(),
    );
  });

  it('final VideoBrief contract uses the shared schema', () => {
    expect(VideoBriefRequirementsSchema).toBe(ProductionRequirementsSchema);
  });

  it('wizard draft contract uses the shared schema', () => {
    expect(WizardRequirementsSchema).toBe(ProductionRequirementsSchema);
  });

  it('wizard configuration contains one label per canonical key', () => {
    expect(PRODUCTION_REQUIREMENT_OPTIONS).toHaveLength(14);
    expect(PRODUCTION_REQUIREMENT_FIELDS).toEqual(PRODUCTION_REQUIREMENT_KEYS);
  });

  it('no extra wizard requirement exists', () => {
    const optionKeys = PRODUCTION_REQUIREMENT_OPTIONS.map((option) => option.value);
    expect(optionKeys.sort()).toEqual([...PRODUCTION_REQUIREMENT_KEYS].sort());
  });

  it('no canonical requirement lacks a label', () => {
    for (const key of PRODUCTION_REQUIREMENT_KEYS) {
      expect(PRODUCTION_REQUIREMENT_LABELS[key].length).toBeGreaterThan(0);
      expect(PRODUCTION_REQUIREMENT_OPTIONS.find((option) => option.value === key)?.label).toBe(
        PRODUCTION_REQUIREMENT_LABELS[key],
      );
    }
  });

  it('database mapping contains one column per canonical key', () => {
    expect(Object.keys(PRODUCTION_REQUIREMENT_DB_COLUMNS)).toHaveLength(14);
  });

  it('database columns are unique', () => {
    expect(new Set(PRODUCTION_REQUIREMENT_DB_COLUMN_NAMES).size).toBe(14);
  });

  it('database mapping contains no extra column', () => {
    expect(Object.keys(PRODUCTION_REQUIREMENT_DB_COLUMNS).sort()).toEqual(
      [...PRODUCTION_REQUIREMENT_KEYS].sort(),
    );
  });

  it('checkbox parser maps an absent value to false', () => {
    expect(parseProductionRequirementCheckbox(null)).toBe(false);
    expect(parseProductionRequirementCheckbox(undefined)).toBe(false);
  });

  it('checkbox parser maps the accepted checked value to true', () => {
    expect(parseProductionRequirementCheckbox('on')).toBe(true);
    expect(parseProductionRequirementCheckbox('true')).toBe(true);
  });

  it('arbitrary strings do not become true', () => {
    expect(parseProductionRequirementCheckbox('yes')).toBe(false);
    expect(parseProductionRequirementCheckbox('1')).toBe(false);
    expect(parseProductionRequirementCheckbox('false')).toBe(false);
  });

  it('review configuration is exhaustive', () => {
    const reviewLabels = PRODUCTION_REQUIREMENT_OPTIONS.map((option) => option.label);
    expect(reviewLabels).toEqual(
      PRODUCTION_REQUIREMENT_KEYS.map((key) => PRODUCTION_REQUIREMENT_LABELS[key]),
    );
  });

  it('repository write mapping is exhaustive', () => {
    const defaults = createDefaultProductionRequirements();
    const dbRow = mapProductionRequirementsToDb(defaults);
    expect(Object.keys(dbRow).sort()).toEqual([...PRODUCTION_REQUIREMENT_DB_COLUMN_NAMES].sort());
  });

  it('repository read mapping is exhaustive', () => {
    const dbRow = mapProductionRequirementsToDb(createDefaultProductionRequirements());
    const roundTrip = mapProductionRequirementsFromDb(dbRow);
    expect(roundTrip).toEqual(createDefaultProductionRequirements());
    expect(mapProductionRequirementsFromDb(dbRow)).toEqual(roundTrip);
    expect(mapProductionRequirementsToDb(roundTrip)).toEqual(dbRow);
  });

  it('requirement ordering is deterministic', () => {
    expect(PRODUCTION_REQUIREMENT_KEYS[0]).toBe('characterConsistency');
    expect(PRODUCTION_REQUIREMENT_KEYS.at(-1)).toBe('commercialUse');
    expect(PRODUCTION_REQUIREMENT_OPTIONS.map((option) => option.value)).toEqual([
      ...PRODUCTION_REQUIREMENT_KEYS,
    ]);
  });

  it('no retired product name exists', () => {
    const corpus = JSON.stringify({
      keys: PRODUCTION_REQUIREMENT_KEYS,
      labels: PRODUCTION_REQUIREMENT_LABELS,
      site: siteConfig.name,
    });
    expect(corpus).not.toMatch(/ScenePilot|Prompt Mixer|Video Mixer|MixPilot/i);
  });

  it('no provider-specific requirement was introduced', () => {
    const corpus = JSON.stringify(PRODUCTION_REQUIREMENT_LABELS).toLowerCase();
    expect(corpus).not.toMatch(/veo|sora|runway|kling|firefly|openai|google/);
  });
});
