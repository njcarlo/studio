/**
 * Generic keyset (cursor) pagination primitive — Layer 1, domain-agnostic.
 *
 * Callers own their Prisma query; this module only handles the cursor:
 * encoding/decoding, the compound `(sortColumn, id)` boundary, and shaping the
 * `PageResult`. Ordering is always the chosen scalar column plus `id` as a
 * stable tiebreaker, so pages never skip or repeat rows under concurrent
 * inserts (unlike OFFSET).
 *
 * Usage (worker action):
 *   const { cursorWhere, orderBy, take } = keysetQuery({ sortField: 'createdAt', sortDir: 'desc', limit, cursor });
 *   const rows = await prisma.worker.findMany({
 *     where: { AND: [baseWhere, cursorWhere] }, orderBy, take, select,
 *   });
 *   return buildPage(rows, { sortField: 'createdAt', limit });
 *
 * Only single scalar columns are supported as the sort key. Map relation/derived
 * sorts (e.g. a worker's role name) to a real scalar column before calling.
 */

export type SortDir = 'asc' | 'desc';

/** Decoded cursor: the sort column's value at the boundary row + its id tiebreaker. */
export type Cursor = { v: unknown; id: string };

export type KeysetParams = {
  /** A single scalar column on the model to order by. */
  sortField: string;
  sortDir?: SortDir;
  /** Page size (rows returned to the caller). Defaults to 25, clamped to 1..200. */
  limit?: number;
  /** Opaque cursor from a previous page's `nextCursor`, or null for the first page. */
  cursor?: string | null;
};

export type PageResult<T> = {
  items: T[];
  /** Pass back as `cursor` to fetch the next page; null when there are no more rows. */
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
};

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

export function clampLimit(limit?: number): number {
  if (!limit || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
}

/** Base64url-encode the boundary so the cursor is opaque to clients. */
export function encodeCursor(c: Cursor): string {
  const json = JSON.stringify({ v: c.v, id: c.id });
  return Buffer.from(json, 'utf8').toString('base64url');
}

/** Decode a cursor; returns null for empty/malformed input (treated as first page). */
export function decodeCursor(s?: string | null): Cursor | null {
  if (!s) return null;
  try {
    const parsed = JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
    if (parsed && typeof parsed.id === 'string') {
      return { v: parsed.v, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Build the Prisma `orderBy`, cursor `where` fragment, and `take` for a keyset page.
 *
 * `take` is `limit + 1` so `buildPage` can detect whether more rows exist without
 * a separate COUNT. AND the returned `cursorWhere` with your own filters.
 */
export function keysetQuery(params: KeysetParams): {
  orderBy: Array<Record<string, SortDir>>;
  cursorWhere: Record<string, unknown>;
  take: number;
  limit: number;
} {
  const dir: SortDir = params.sortDir === 'desc' ? 'desc' : 'asc';
  const limit = clampLimit(params.limit);
  const field = params.sortField;
  const orderBy = [{ [field]: dir }, { id: dir }];

  const cursor = decodeCursor(params.cursor);
  if (!cursor) {
    return { orderBy, cursorWhere: {}, take: limit + 1, limit };
  }

  // Asc:  (field > v) OR (field = v AND id > lastId)
  // Desc: (field < v) OR (field = v AND id < lastId)
  const op = dir === 'asc' ? 'gt' : 'lt';
  const cursorWhere = {
    OR: [
      { [field]: { [op]: cursor.v } },
      { AND: [{ [field]: cursor.v }, { id: { [op]: cursor.id } }] },
    ],
  };

  return { orderBy, cursorWhere, take: limit + 1, limit };
}

/**
 * Trim the over-fetched sentinel row and derive `nextCursor` from the last kept
 * row. `sortField` must be the same column passed to `keysetQuery`.
 */
export function buildPage<T extends { id: string } & Record<string, unknown>>(
  rows: T[],
  opts: { sortField: string; limit?: number },
): PageResult<T> {
  const limit = clampLimit(opts.limit);
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  const last = items[items.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor({ v: last[opts.sortField], id: last.id }) : null;

  return { items, nextCursor, hasMore, limit };
}
