export type AuthUser = {
  id: string;
  email: string;
};

export type CallerCtx = {
  workerId: string;
  email: string;
  isSuperAdmin: boolean;
  permissions: Set<string>;
};

export type AuthUserGetter = () => Promise<AuthUser | null>;
