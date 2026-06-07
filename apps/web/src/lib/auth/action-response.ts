/**
 * Standardized response envelope for all Server Actions.
 *
 * Using a discriminated union means the client can check `result.success`
 * before accessing `result.data`, and errors are always user-readable strings
 * with no raw stack traces or DB details leaking to the browser.
 *
 * Usage in a Server Action:
 *   return { success: true, data: worker };
 *   return { success: false, error: 'You do not have permission to do this.' };
 */

export type ActionSuccess<T> = { success: true; data: T };
export type ActionError = { success: false; error: string };
export type ActionResponse<T> = ActionSuccess<T> | ActionError;

/** Helper to wrap a value as a successful response. */
export function ok<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

/** Helper to wrap an error message as a failed response. */
export function err(error: string): ActionError {
  return { success: false, error };
}

/**
 * Normalizes any caught error to a safe, user-readable string.
 * Strips Prisma error codes and stack traces.
 */
export function toErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    // Forbidden / auth errors — return as-is
    if (e.message === 'Not authenticated') return 'You must be logged in to do this.';
    if (e.message === 'Forbidden') return 'You do not have permission to do this.';
    // Prisma unique constraint
    if ((e as any).code === 'P2002') return 'A record with these details already exists.';
    // Prisma foreign-key / record not found
    if ((e as any).code === 'P2025') return 'The record you are trying to modify no longer exists.';
    return e.message;
  }
  return 'An unexpected error occurred.';
}
