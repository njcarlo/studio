/**
 * @studio/core-engine — shared platform primitives for Studio apps.
 *
 * See docs/CORE_ENGINE_C2S_PLAN.md
 */

export {
  ok,
  err,
  toErrorMessage,
  type ActionSuccess,
  type ActionError,
  type ActionResponse,
} from './src/auth/action-response';

export type { AuthUser, AuthUserGetter, CallerCtx } from './src/auth/types';
export { configureAuthUserGetter, getConfiguredAuthUser } from './src/auth/configure';
export { resolveCallerCtx } from './src/auth/resolve-caller';
export {
  withPermission,
  withPublicAction,
  canManageWorkersInMinistries,
  canManageWorker,
  isHRWorker,
} from './src/auth/with-permission';

export { EmailService } from './src/notify/email';

export {
  getActiveStages,
  createWorkflow,
  decide,
  getActionableWorkflows,
  canActOnStage,
  type ApproverSpec,
  type StageTemplate,
  type CreateWorkflowInput,
  type DecideInput,
  type WorkflowWithStages,
} from './src/approvals/engine';

export {
  DEFAULT_TENANT,
  DEFAULT_BRAND_COLOR,
  getTenantConfig,
  tenantDisplayName,
  tenantInitials,
  tenantFileSlug,
  isFeatureEnabled,
  tenantBrandStyle,
  moduleAppUrl,
  c2sPublicUrl,
  studioAppUrl,
  type TenantConfig,
  type ModuleSlug,
  type FeatureFlag,
} from './src/tenant';
