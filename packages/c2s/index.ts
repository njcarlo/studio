/**
 * @studio/c2s — Connect2Souls domain logic (groups, mentees, sessions, join requests).
 * UI stays in apps/web (and later apps/c2s-public). See docs/CORE_ENGINE_C2S_PLAN.md.
 */
export {
  C2S_JOIN_REQUEST_WORKFLOW_TYPE,
  canManageC2SGroup,
  getMentorGroups,
  getAllC2SGroupsWithMentees,
  updateGroupProfile,
  listPublicC2SGroups,
  createC2SJoinRequest,
  syncC2SJoinRequestFromWorkflow,
  createC2SSession,
  getC2SSessionsForGroup,
  updateC2SSession,
  deleteC2SSession,
  getSessionGroupId,
  createMenteeInGroup,
  updateMentee,
  deleteMentee,
  getMenteeGroupId,
  getMentorJoinRequests,
  type UpdateGroupProfileInput,
  type CreateJoinRequestInput,
  type CreateSessionInput,
  type UpdateSessionInput,
  type MenteeInput,
  type MentorJoinRequest,
} from './src/service';
