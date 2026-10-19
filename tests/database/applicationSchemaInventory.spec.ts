import { describe, expect, it } from 'vitest';
import {
  APPLICATION_OWNED_PUBLIC_TABLES,
  APPLICATION_TABLE_COUNT,
  CATALOGUE_TABLES,
  FORBIDDEN_APPLICATION_TABLES,
  FOUNDATION_TABLES,
  PIVOT_PERSISTENCE_TABLES,
  PIVOT_TABLE_COUNT,
} from '../../src/domain/applicationSchemaInventory.js';

const FOUNDATION_AND_CATALOGUE = [
  'profiles',
  'projects',
  'video_briefs',
  'ai_video_providers',
  'ai_video_offerings',
  'ai_video_sources',
  'ai_video_capability_facts',
] as const;

describe('application schema inventory contract', () => {
  it('defines nineteen application-owned tables', () => {
    expect(APPLICATION_TABLE_COUNT).toBe(19);
    expect(APPLICATION_OWNED_PUBLIC_TABLES).toHaveLength(19);
  });

  it('uses unique table names', () => {
    expect(new Set(APPLICATION_OWNED_PUBLIC_TABLES).size).toBe(19);
  });

  it('includes foundation and catalogue tables', () => {
    for (const tableName of FOUNDATION_AND_CATALOGUE) {
      expect(APPLICATION_OWNED_PUBLIC_TABLES).toContain(tableName);
    }
  });

  it('includes all pivot persistence tables', () => {
    expect(PIVOT_TABLE_COUNT).toBe(12);
    for (const tableName of PIVOT_PERSISTENCE_TABLES) {
      expect(APPLICATION_OWNED_PUBLIC_TABLES).toContain(tableName);
    }
  });

  it('excludes scene tables', () => {
    expect(APPLICATION_OWNED_PUBLIC_TABLES).not.toContain('scenes');
    expect(FORBIDDEN_APPLICATION_TABLES).toContain('scenes');
  });

  it('excludes plan tables', () => {
    expect(APPLICATION_OWNED_PUBLIC_TABLES).not.toContain('video_plans');
    expect(FORBIDDEN_APPLICATION_TABLES).toContain('video_plans');
  });

  it('excludes recommendation tables', () => {
    expect(APPLICATION_OWNED_PUBLIC_TABLES).not.toContain('provider_recommendations');
    expect(FORBIDDEN_APPLICATION_TABLES).toContain('provider_recommendations');
  });

  it('excludes workspace-result tables', () => {
    expect(APPLICATION_OWNED_PUBLIC_TABLES).not.toContain('result_workspaces');
    expect(FORBIDDEN_APPLICATION_TABLES).toContain('result_workspaces');
  });

  it('counts four provider catalogue tables', () => {
    expect(CATALOGUE_TABLES).toHaveLength(4);
    for (const tableName of CATALOGUE_TABLES) {
      expect(APPLICATION_OWNED_PUBLIC_TABLES).toContain(tableName);
    }
  });

  it('counts three foundation tables for profiles, projects, and briefs', () => {
    expect(FOUNDATION_TABLES).toHaveLength(3);
    for (const tableName of FOUNDATION_TABLES) {
      expect(APPLICATION_OWNED_PUBLIC_TABLES).toContain(tableName);
    }
  });

  it('sums foundation, catalogue, and pivot tables to nineteen', () => {
    expect(FOUNDATION_TABLES.length + CATALOGUE_TABLES.length + PIVOT_TABLE_COUNT).toBe(19);
  });

  it('does not misclassify RPC names as tables', () => {
    expect(APPLICATION_OWNED_PUBLIC_TABLES).not.toContain('prompt_pilot_complete_video_brief');
    expect(APPLICATION_OWNED_PUBLIC_TABLES).not.toContain('prompt_pilot_soft_delete_project');
    expect(APPLICATION_OWNED_PUBLIC_TABLES).not.toContain('prompt_pilot_set_latest_analysis');
  });
});
