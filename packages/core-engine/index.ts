/**
 * @studio/core-engine — shared platform primitives for Studio apps.
 *
 * Slice A: action response envelope, email notify, approval workflow engine,
 * tenant config stub. Auth gate (`withPermission`) lands in the next slice.
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
  getTenantConfig,
  type TenantConfig,
} from './src/tenant';
