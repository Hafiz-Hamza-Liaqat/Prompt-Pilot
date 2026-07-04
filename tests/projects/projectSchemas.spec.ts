import { describe, expect, it } from 'vitest';
import {
  buildDuplicateTitle,
  createProjectInputSchema,
  isProjectActionStatus,
  projectDashboardQuerySchema,
  projectDescriptionSchema,
  projectIdSchema,
  projectPageSchema,
  projectSearchSchema,
  projectTitleSchema,
} from '../../src/domain/project.js';

describe('projectTitleSchema', () => {
  it('accepts valid titles', () => {
    expect(projectTitleSchema.parse('Launch video')).toBe('Launch video');
  });

  it('rejects empty titles', () => {
    expect(() => projectTitleSchema.parse('')).toThrow();
  });

  it('rejects whitespace-only titles', () => {
    expect(() => projectTitleSchema.parse('   ')).toThrow();
  });

  it('rejects titles over 120 characters', () => {
    expect(() => projectTitleSchema.parse('a'.repeat(121))).toThrow();
  });

  it('accepts Unicode titles', () => {
    expect(projectTitleSchema.parse('日本語タイトル')).toBe('日本語タイトル');
  });

  it('rejects control characters in titles', () => {
    expect(() => projectTitleSchema.parse('Bad\u0007Title')).toThrow();
  });
});

describe('projectDescriptionSchema', () => {
  it('normalizes empty descriptions to null', () => {
    expect(projectDescriptionSchema.parse('')).toBeNull();
    expect(projectDescriptionSchema.parse(undefined)).toBeNull();
  });

  it('rejects descriptions over 500 characters', () => {
    expect(() => projectDescriptionSchema.parse('a'.repeat(501))).toThrow();
  });
});

describe('projectIdSchema', () => {
  it('accepts valid UUIDs', () => {
    expect(projectIdSchema.parse('11111111-1111-1111-1111-111111111111')).toBe(
      '11111111-1111-1111-1111-111111111111',
    );
  });

  it('rejects invalid UUIDs', () => {
    expect(() => projectIdSchema.parse('not-a-uuid')).toThrow();
  });
});

describe('projectDashboardQuerySchema', () => {
  it('defaults filter to active', () => {
    expect(projectDashboardQuerySchema.parse({}).status).toBe('active');
  });

  it('defaults sort to updated_desc', () => {
    expect(projectDashboardQuerySchema.parse({}).sort).toBe('updated_desc');
  });

  it('rejects invalid filters', () => {
    expect(() => projectDashboardQuerySchema.parse({ status: 'deleted' })).toThrow();
  });

  it('rejects invalid sort options', () => {
    expect(() => projectDashboardQuerySchema.parse({ sort: 'name_asc' })).toThrow();
  });
});

describe('projectSearchSchema', () => {
  it('rejects search over 100 characters', () => {
    expect(() => projectSearchSchema.parse('a'.repeat(101))).toThrow();
  });
});

describe('projectPageSchema', () => {
  it('rejects invalid pages', () => {
    expect(() => projectPageSchema.parse(0)).toThrow();
    expect(() => projectPageSchema.parse(-1)).toThrow();
  });
});

describe('buildDuplicateTitle', () => {
  it('adds a copy suffix', () => {
    expect(buildDuplicateTitle('Launch')).toBe('Launch (Copy)');
  });

  it('truncates long titles before adding suffix', () => {
    const longTitle = 'a'.repeat(120);
    const duplicate = buildDuplicateTitle(longTitle);
    expect(duplicate.endsWith(' (Copy)')).toBe(true);
    expect(duplicate.length).toBeLessThanOrEqual(120);
  });

  it('never returns empty text', () => {
    expect(buildDuplicateTitle('x').trim().length).toBeGreaterThan(0);
  });
});

describe('isProjectActionStatus', () => {
  it('rejects unknown values', () => {
    expect(isProjectActionStatus('idle')).toBe(true);
    expect(isProjectActionStatus('unknown_state')).toBe(false);
  });
});

describe('createProjectInputSchema', () => {
  it('accepts valid create input', () => {
    expect(
      createProjectInputSchema.parse({
        title: 'My project',
        description: 'Short summary',
      }),
    ).toEqual({
      title: 'My project',
      description: 'Short summary',
    });
  });
});
