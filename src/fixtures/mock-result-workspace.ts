import {
  MOCK_PROMPT_SECTION_KEYS,
  MockResultWorkspaceStaticFixtureSchema,
  WORKSPACE_FIXTURE_VERSION,
  WORKSPACE_SAMPLE_DISCLAIMER,
  type MockResultWorkspaceStaticFixture,
} from '@/domain/mockResultWorkspace';

const fixtureData = {
  fixtureVersion: WORKSPACE_FIXTURE_VERSION,
  sampleDisclaimer: WORKSPACE_SAMPLE_DISCLAIMER,
  samplePromptSections: [
    {
      key: MOCK_PROMPT_SECTION_KEYS[0],
      label: 'Scene objective',
      sampleContent: 'Placeholder objective block for interface preview only.',
      isSample: true as const,
    },
    {
      key: MOCK_PROMPT_SECTION_KEYS[1],
      label: 'Visual direction',
      sampleContent: 'Neutral visual-direction placeholder with no provider-specific syntax.',
      isSample: true as const,
    },
    {
      key: MOCK_PROMPT_SECTION_KEYS[2],
      label: 'Subject and action',
      sampleContent: 'Demonstration subject/action copy that does not mirror a user script.',
      isSample: true as const,
    },
    {
      key: MOCK_PROMPT_SECTION_KEYS[3],
      label: 'Camera direction',
      sampleContent: 'Sample camera notes for layout validation only.',
      isSample: true as const,
    },
    {
      key: MOCK_PROMPT_SECTION_KEYS[4],
      label: 'Environment',
      sampleContent: 'Example environment description slot for future compiled prompts.',
      isSample: true as const,
    },
    {
      key: MOCK_PROMPT_SECTION_KEYS[5],
      label: 'Continuity constraints',
      sampleContent: 'Placeholder continuity notes without claiming verified continuity coverage.',
      isSample: true as const,
    },
    {
      key: MOCK_PROMPT_SECTION_KEYS[6],
      label: 'Audio notes',
      sampleContent: 'Sample audio guidance slot. No dialogue or voiceover is generated here.',
      isSample: true as const,
    },
    {
      key: MOCK_PROMPT_SECTION_KEYS[7],
      label: 'Negative constraints',
      sampleContent: 'Demonstration negative-constraint block for future prompt compilation.',
      isSample: true as const,
    },
  ],
  continuityItems: [
    {
      key: 'character_identity',
      label: 'Character identity',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Future continuity bible content would appear here.',
      isSample: true as const,
    },
    {
      key: 'product_appearance',
      label: 'Product appearance',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Layout preview for product-lock guidance.',
      isSample: true as const,
    },
    {
      key: 'brand_elements',
      label: 'Brand elements',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Sample slot for logo and brand continuity organization.',
      isSample: true as const,
    },
    {
      key: 'location_continuity',
      label: 'Location continuity',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Demonstration checklist row only.',
      isSample: true as const,
    },
    {
      key: 'lighting_continuity',
      label: 'Lighting continuity',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Interface preview for lighting guidance.',
      isSample: true as const,
    },
    {
      key: 'camera_language',
      label: 'Camera language',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Sample organization for future camera notes.',
      isSample: true as const,
    },
    {
      key: 'wardrobe_props',
      label: 'Wardrobe and props',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Placeholder continuity category.',
      isSample: true as const,
    },
    {
      key: 'on_screen_text',
      label: 'On-screen text',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Sample slot for exact-text continuity planning.',
      isSample: true as const,
    },
  ],
  audioEditingItems: [
    {
      key: 'voiceover_planning',
      label: 'Voiceover planning slot',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Demonstration layout for narration planning.',
      isSample: true as const,
    },
    {
      key: 'dialogue_planning',
      label: 'Dialogue planning slot',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'No dialogue script is generated in this preview.',
      isSample: true as const,
    },
    {
      key: 'native_audio_planning',
      label: 'Native-audio planning slot',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Sample slot for native-audio guidance.',
      isSample: true as const,
    },
    {
      key: 'music_ambience',
      label: 'Music and ambience slot',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Layout preview for music and ambience notes.',
      isSample: true as const,
    },
    {
      key: 'transition_guidance',
      label: 'Transition guidance slot',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Demonstration transition guidance placeholder.',
      isSample: true as const,
    },
    {
      key: 'editing_rhythm',
      label: 'Editing rhythm slot',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Sample editing rhythm organization.',
      isSample: true as const,
    },
    {
      key: 'caption_text',
      label: 'Caption and text slot',
      evaluationState: 'future_evaluation' as const,
      sampleNote: 'Interface preview for caption planning.',
      isSample: true as const,
    },
  ],
} as const satisfies MockResultWorkspaceStaticFixture;

export const mockResultWorkspaceFixture =
  MockResultWorkspaceStaticFixtureSchema.parse(fixtureData);
