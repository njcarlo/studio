/**
 * Web auth gate — configures Firebase session resolution, then re-exports
 * `@studio/core-engine` permission helpers.
 *
 * Prefer importing from here (or `@studio/core-engine` after `configureAuthUserGetter`)
 * so Server Actions always have an auth user getter.
 */
import { getServerUser } from '@/lib/firebase-auth-server';
import { configureAuthUserGetter } from '@studio/core-engine';

configureAuthUserGetter(getServerUser);

export type { CallerCtx, AuthUser, ActionResponse, ActionSuccess, ActionError } from '@studio/core-engine';
export {
  resolveCallerCtx,
  withPermission,
  withPublicAction,
  canManageWorkersInMinistries,
  canManageWorker,
  isHRWorker,
  ok,
  err,
  toErrorMessage,
} from '@studio/core-engine';
