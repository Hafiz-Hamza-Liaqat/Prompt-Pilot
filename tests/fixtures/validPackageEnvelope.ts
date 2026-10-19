import type { PackageEnvelope } from '../../src/domain/canonical/package.js';

const TIMESTAMP = '2026-07-05T12:30:00.000Z';

export const validPromptPackageEnvelopeFixture: PackageEnvelope = {
  packageId: 'package-prompt-001',
  packageType: 'prompt',
  projectId: 'project-hydrobottle-001',
  referenceId: 'reference-youtube-001',
  analysisId: 'analysis-ref-youtube-001',
  analysisVersion: 1,
  packageVersion: 1,
  generatorVersion: '1.0.0',
  generatorKind: 'mock',
  generatorProvider: 'prompt-pilot-mock',
  dependsOn: [
    {
      entity: 'reference_video_analysis',
      id: 'analysis-ref-youtube-001',
      version: 1,
    },
  ],
  inputManifest: [
    {
      entity: 'reference_video_analysis',
      id: 'analysis-ref-youtube-001',
    },
  ],
  payload: {
    masterPrompt: 'Provider-neutral master prompt derived from analysis snapshot.',
    compiledPrompts: [
      {
        promptId: 'prompt-scene-001',
        sceneId: 'scene-001',
        provider: 'runway',
        providerModel: 'gen-3-alpha',
        compilerVersion: '1.0.0',
        mainPrompt: 'Runway prompt for observed hook segment',
        shortPrompt: 'Short hook prompt',
        detailedPrompt: 'Detailed runway generation prompt for hook segment',
        negativeConstraints: ['blurry label'],
        referenceAssetInstructions: ['Use product lock for label accuracy'],
        suggestedSettings: [{ key: 'duration', value: 8 }],
        expectedWeaknesses: ['Fine print may drift'],
        retryVariation: 'Retry with tighter product emphasis',
        createdAt: TIMESTAMP,
      },
    ],
  },
  createdAt: TIMESTAMP,
  createdByJobId: 'job-001',
  transformationNotice:
    'Prompts are transformative instructions — not reproductions of source media.',
  exportReady: true,
};

export const validBlueprintPackageEnvelopeFixture: PackageEnvelope = {
  packageId: 'package-blueprint-001',
  packageType: 'blueprint',
  projectId: 'project-hydrobottle-001',
  referenceId: 'reference-youtube-001',
  analysisId: 'analysis-ref-youtube-001',
  analysisVersion: 1,
  packageVersion: 1,
  generatorVersion: '1.0.0',
  generatorKind: 'mock',
  generatorProvider: 'prompt-pilot-mock',
  dependsOn: [
    {
      entity: 'reference_video_analysis',
      id: 'analysis-ref-youtube-001',
      version: 1,
    },
  ],
  inputManifest: [
    {
      entity: 'reference_video_analysis',
      id: 'analysis-ref-youtube-001',
    },
  ],
  payload: {
    storyboardSummary: 'Two-segment blueprint aligned to observed hook and body structure.',
    cameraNotes: ['Maintain eye-level framing in hook'],
    lightingNotes: ['High-key consistent lighting'],
    voiceoverStructure: ['Hook VO line', 'Feature stack', 'CTA line'],
    audioMoodNotes: ['Upbeat electronic bed'],
  },
  createdAt: TIMESTAMP,
  createdByJobId: 'job-001',
  transformationNotice: 'Blueprint is prescriptive guidance derived from observed analysis.',
  exportReady: true,
};
