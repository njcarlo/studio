"use server";

import { withPublicAction } from '@studio/core-engine';
import * as C2S from '@studio/c2s';

export const getPublicC2SGroups = withPublicAction(async () => {
  return C2S.listPublicC2SGroups();
});

export const submitC2SJoinRequest = withPublicAction(async (input: C2S.CreateJoinRequestInput) => {
  const { joinRequest } = await C2S.createC2SJoinRequest(input);
  return joinRequest;
});
