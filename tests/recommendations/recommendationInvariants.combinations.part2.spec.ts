import { describe, it } from 'vitest';
import {
  RECOMMENDATION_COMBINATION_CHUNK_SIZE,
  runRecommendationInvariantLoop,
} from './recommendationInvariantLoop.js';

const FIRST_CHUNK_INDEX = 4;
const CHUNKS_PER_FILE = 4;

describe('exhaustive 16384 requirement-combination loop (part 2)', () => {
  for (let offset = 0; offset < CHUNKS_PER_FILE; offset += 1) {
    const chunkIndex = FIRST_CHUNK_INDEX + offset;
    const startMask = chunkIndex * RECOMMENDATION_COMBINATION_CHUNK_SIZE;
    const endMask = startMask + RECOMMENDATION_COMBINATION_CHUNK_SIZE;

    it(`passes invariants for requirement combinations ${startMask}–${endMask - 1}`, () => {
      runRecommendationInvariantLoop(startMask, endMask);
    }, 60_000);
  }
});
