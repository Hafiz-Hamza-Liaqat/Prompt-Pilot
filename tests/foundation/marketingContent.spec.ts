import { describe, expect, it } from 'vitest';
import { marketingContent } from '../../src/config/marketing.js';

const retiredNamePattern = /ScenePilot|Scene Pilot|scene-pilot|scenepilot|PromptPilot|Prompt-Pilot/i;

describe('marketingContent', () => {
  it('defines four workflow steps', () => {
    expect(marketingContent.workflowSteps).toHaveLength(4);
  });

  it('uses unique sequential workflow step numbers', () => {
    const steps = marketingContent.workflowSteps.map((step) => step.step);
    expect(steps).toEqual([1, 2, 3, 4]);
    expect(new Set(steps).size).toBe(steps.length);
  });

  it('defines four capability records', () => {
    expect(marketingContent.capabilities).toHaveLength(4);
  });

  it('uses unique capability titles', () => {
    const titles = marketingContent.capabilities.map((capability) => capability.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('has non-empty supported-output statements', () => {
    for (const item of marketingContent.supportedOutputs) {
      expect(item.trim().length).toBeGreaterThan(0);
    }
  });

  it('includes video generation in unsupported outputs', () => {
    expect(marketingContent.unsupportedOutputs.join(' ').toLowerCase()).toContain('video generation');
  });

  it('includes image generation in unsupported outputs', () => {
    expect(marketingContent.unsupportedOutputs.join(' ').toLowerCase()).toContain('image generation');
  });

  it('does not claim that Prompt Pilot currently generates media', () => {
    const corpus = [
      marketingContent.heroDescription,
      marketingContent.honestyStatement,
      ...marketingContent.capabilities.map((item) => item.description),
      ...marketingContent.supportedOutputs,
      ...marketingContent.unsupportedOutputs,
    ]
      .join(' ')
      .toLowerCase();

    expect(corpus).not.toMatch(/(?<!does not )(?<!do not )generates videos/);
    expect(corpus).not.toMatch(/(?<!does not )(?<!do not )generates images/);
    expect(corpus).toMatch(/does not generate videos/);
    expect(corpus).toMatch(/does not generate videos or images|does not generate images/);
  });

  it('contains no retired product name', () => {
    const corpus = JSON.stringify(marketingContent);
    expect(corpus).not.toMatch(retiredNamePattern);
  });

  it('contains no empty placeholder text', () => {
    const corpus = JSON.stringify(marketingContent);
    expect(corpus).not.toContain('TODO');
    expect(corpus).not.toContain('Lorem ipsum');
    expect(corpus).not.toContain('placeholder');
  });
});
