/** Link Intelligence operational defaults — PP-05 design. */
export const LINK_INTELLIGENCE_CONFIG = {
  maxUrlLength: 2048,
  maxRetries: 3,
  retryBackoffMs: [250, 1_000, 4_000] as const,
  fetchTimeoutMs: 10_000,
  stageTimeoutMs: 30_000,
  maxResponseBytes: 256 * 1024,
} as const;

export const YOUTUBE_ALLOWED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'music.youtube.com',
]);

export const VIMEO_ALLOWED_HOSTS = new Set([
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
]);

export const BLOCKED_FETCH_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
  'metadata.google.internal',
  '169.254.169.254',
]);
