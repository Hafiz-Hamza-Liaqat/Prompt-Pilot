import { describe, expect, it } from 'vitest';
import {
  APPLICATION_OWNED_PUBLIC_TABLES,
  APPLICATION_TABLE_COUNT,
  CATALOGUE_TABLES,
  FORBIDDEN_APPLICATION_TABLES,
  FOUNDATION_TABLES,
} from '../../src/domain/applicationSchemaInventory.js';

const EXPECTED_TABLES = [
  'profiles',
  'projects',
  'video_briefs',
  'ai_video_providers',
  'ai_video_offerings',
  'ai_video_sources',
  'ai_video_capability_facts',
] as const;

describe('application schema inventory contract', () => {
  it('defines exactly seven application-owned tables', () => {
    expect(APPLICATION_TABLE_COUNT).toBe(7);
    expect(APPLICATION_OWNED_PUBLIC_TABLES).toHaveLength(7);
  });

  it('uses unique table names', () => {
    expect(new Set(APPLICATION_OWNED_PUBLIC_TABLES).size).toBe(7);
  });

  it('includes all expected table names', () => {
    for (const tableName of EXPECTED_TABLES) {
      expect(APPLICATION_OWNED_PUBLIC_TABLES).toContain(tableName);
    }
  });

  it('contains no extra table names', () => {
    expect([...APPLICATION_OWNED_PUBLIC_TABLES].sort()).toEqual([...EXPECTED_TABLES].sort());
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

  it('sums foundation and catalogue tables to seven', () => {
    expect(FOUNDATION_TABLES.length + CATALOGUE_TABLES.length).toBe(7);
  });

  it('does not misclassify RPC names as tables', () => {
    expect(APPLICATION_OWNED_PUBLIC_TABLES).not.toContain('prompt_pilot_complete_video_brief');
    expect(APPLICATION_OWNED_PUBLIC_TABLES).not.toContain('prompt_pilot_soft_delete_project');
  });
});
