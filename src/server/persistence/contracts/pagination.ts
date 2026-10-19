/**
 * Cursor-based pagination for append-heavy entities (jobs, events, exports).
 */

export type PageCursor = string;

export type CursorPageRequest = {
  limit: number;
  cursor?: PageCursor;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: PageCursor | null;
  hasMore: boolean;
};

/**
 * Offset pagination for bounded lists (references per project).
 */

export type OffsetPageRequest = {
  limit: number;
  offset: number;
};

export type OffsetPage<T> = {
  items: T[];
  total: number;
};
