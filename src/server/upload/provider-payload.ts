/** Keys that must never appear in client-visible upload target payloads (G-29). */
const FORBIDDEN_PROVIDER_PAYLOAD_KEYS = new Set([
  'objectKey',
  'objectkey',
  'bucket',
  'locator',
  'storageLocator',
  'storage_locator',
  'key',
  'path',
  'uri',
  'url',
]);

/**
 * Strips provider-internal identifiers from upload target payloads before
 * they cross the API boundary. Opaque tokens (uploadId, method) are retained.
 */
export function sanitizeProviderPayloadForClient(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (FORBIDDEN_PROVIDER_PAYLOAD_KEYS.has(key)) {
      continue;
    }
    if (typeof value === 'string' && value.includes('://')) {
      continue;
    }
    sanitized[key] = value;
  }

  return sanitized;
}
