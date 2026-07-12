import type { AuthUserGetter } from './types';

/**
 * Host apps (Next.js, Cloud Functions, etc.) inject how to resolve the
 * current user. Next wires Firebase session cookies via `configureAuthUserGetter(getServerUser)`.
 */
let getAuthUser: AuthUserGetter = async () => null;

export function configureAuthUserGetter(getter: AuthUserGetter): void {
  getAuthUser = getter;
}

export function getConfiguredAuthUser() {
  return getAuthUser();
}
