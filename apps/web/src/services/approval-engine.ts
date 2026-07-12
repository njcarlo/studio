/**
 * @deprecated Import from `@studio/core-engine` instead.
 * Re-export shim — approval engine lives in packages/core-engine (Slice A).
 */
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
} from '@studio/core-engine';
