/**
 * Standardized response envelope for Server Actions / RPC handlers.
 *
 * Discriminated union: check `result.success` before accessing `result.data`.
 */

export type ActionSuccess<T> = { success: true; data: T };
export type ActionError = { success: false; error: string };
export type ActionResponse<T> = ActionSuccess<T> | ActionError;

export function ok<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

export function err(error: string): ActionError {
  return { success: false, error };
}

export function toErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    if (e.message === 'Not authenticated') return 'You must be logged in to do this.';
    if (e.message === 'Forbidden') return 'You do not have permission to do this.';
    if ((e as { code?: string }).code === 'P2002') return 'A record with these details already exists.';
    if ((e as { code?: string }).code === 'P2025') {
      return 'The record you are trying to modify no longer exists.';
    }
    return e.message;
  }
  return 'An unexpected error occurred.';
}
