"use server";

import { revalidatePath } from 'next/cache';
import { withPublicAction } from '@studio/core-engine';
import * as C2S from '@studio/c2s';
import { withC2SRole, ALL_C2S_ROLES } from './guard';

// --- Public (anonymous) -----------------------------------------------------

export const getPublicC2SGroups = withPublicAction(async () => {
  return C2S.listPublicC2SGroups();
});

export const submitC2SJoinRequest = withPublicAction(async (input: C2S.CreateJoinRequestInput) => {
  const { joinRequest } = await C2S.createC2SJoinRequest(input);
  revalidatePath('/group-finder');
  return joinRequest;
});

// --- Pipeline (coordinator, cluster head, ministry head) --------------------

export const assignPipelineToCoordinator = withC2SRole(
  ['cluster_head', 'ministry_head'],
  async (_user, requestId: string, coordinatorId: string) => {
    const updated = await C2S.assignPipelineCoordinator(requestId, coordinatorId);
    revalidatePath('/dashboard');
    return updated;
  },
);

export const assignPipelineToMentor = withC2SRole(
  ['c2s_coordinator', 'cluster_head', 'ministry_head'],
  async (_user, requestId: string, mentorId: string) => {
    const updated = await C2S.assignPipelineMentor(requestId, mentorId);
    revalidatePath('/dashboard');
    return updated;
  },
);

export const scheduleInterview = withC2SRole(
  ['c2s_coordinator', 'cluster_head', 'ministry_head'],
  async (_user, requestId: string, interviewDate: string) => {
    const updated = await C2S.schedulePipelineInterview(requestId, new Date(interviewDate));
    revalidatePath('/dashboard');
    return updated;
  },
);

export const setPipelineStatus = withC2SRole(
  ALL_C2S_ROLES,
  async (_user, requestId: string, status: C2S.PipelineStatus) => {
    const updated = await C2S.updatePipelineStatus(requestId, status);
    revalidatePath('/dashboard');
    return updated;
  },
);

export const savePipelineNotes = withC2SRole(
  ALL_C2S_ROLES,
  async (_user, requestId: string, notes: string) => {
    const updated = await C2S.updatePipelineNotes(requestId, notes);
    revalidatePath('/dashboard');
    return updated;
  },
);

export const recommendMentee = withC2SRole(
  ALL_C2S_ROLES,
  async (user, input: {
    groupId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    barangay?: string;
    gender?: string;
    notes?: string;
    preferredGroupIds?: string[];
  }) => {
    const created = await C2S.createRecommendedPipelineEntry({ ...input, recommendedById: user.id });
    revalidatePath('/dashboard');
    return created;
  },
);

/** Accepts a potential mentee into the mentor's group, creating the mentee record. */
export const acceptMentee = withC2SRole(
  ['mentor', 'c2s_coordinator', 'cluster_head', 'ministry_head'],
  async (_user, requestId: string, status: C2S.PipelineStatus = 'Accepted') => {
    const updated = await C2S.updatePipelineStatus(requestId, status);
    revalidatePath('/dashboard');
    return updated;
  },
);

// --- Groups -----------------------------------------------------------------

export const createGroup = withC2SRole(
  ['mentor', 'c2s_coordinator', 'cluster_head', 'ministry_head'],
  async (user, input: Omit<C2S.AdminCreateGroupInput, 'mentorId'> & { mentorId?: string }) => {
    const created = await C2S.createAdminC2SGroup({ ...input, mentorId: input.mentorId ?? user.id });
    revalidatePath('/dashboard');
    revalidatePath('/group-finder');
    return created;
  },
);

export const updateGroup = withC2SRole(
  ALL_C2S_ROLES,
  async (user, groupId: string, input: C2S.UpdateGroupProfileInput) => {
    if (!(await C2S.canManageC2SGroup({
      workerId: user.id,
      email: user.email,
      isSuperAdmin: user.role === 'ministry_head',
      permissions: new Set(user.role === 'ministry_head' ? ['mentorship:manage'] : []),
    }, groupId))) {
      throw new Error('You do not manage this group.');
    }
    const updated = await C2S.updateGroupProfile(groupId, input);
    revalidatePath('/dashboard');
    revalidatePath('/group-finder');
    return updated;
  },
);

export const deleteGroup = withC2SRole(
  ['ministry_head', 'cluster_head'],
  async (_user, groupId: string) => {
    await C2S.deleteAdminC2SGroup(groupId);
    revalidatePath('/dashboard');
    revalidatePath('/group-finder');
  },
);

// --- Mentees ----------------------------------------------------------------

export const saveMentee = withC2SRole(
  ALL_C2S_ROLES,
  async (_user, menteeId: string, input: Partial<C2S.MenteeInput>) => {
    const updated = await C2S.updateMentee(menteeId, input);
    revalidatePath('/dashboard');
    return updated;
  },
);

export const moveMenteeToGroup = withC2SRole(
  ALL_C2S_ROLES,
  async (_user, menteeId: string, toGroupId: string) => {
    const moved = await C2S.transferMentee(menteeId, toGroupId);
    revalidatePath('/dashboard');
    return moved;
  },
);

export const markMenteeInactive = withC2SRole(
  ALL_C2S_ROLES,
  async (_user, menteeId: string, reason: string) => {
    const updated = await C2S.deactivateMentee(menteeId, reason);
    revalidatePath('/dashboard');
    return updated;
  },
);

export const endorseMenteeAsWorker = withC2SRole(
  ['mentor', 'cluster_head', 'ministry_head'],
  async (user, menteeId: string) => {
    const updated = await C2S.endorseMentee(menteeId, user.id);
    revalidatePath('/dashboard');
    return updated;
  },
);

// --- Devotional progress ----------------------------------------------------

export const loadDevotions = withC2SRole(
  ALL_C2S_ROLES,
  async (_user, menteeId: string) => C2S.getDevotionEntries(menteeId),
);

export const saveDevotion = withC2SRole(
  ALL_C2S_ROLES,
  async (_user, input: { menteeId: string; date: string; module?: string; lesson?: string; completed?: boolean; notes?: string }) => {
    const saved = await C2S.logDevotionEntry({ ...input, date: new Date(input.date) });
    revalidatePath('/dashboard');
    return saved;
  },
);
