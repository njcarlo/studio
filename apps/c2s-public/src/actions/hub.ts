"use server";

import { revalidatePath } from 'next/cache';
import { withPublicAction } from '@studio/core-engine';
import { withC2SRole } from './guard';
import {
    createHubApplication,
    setHubApplicationStatus,
    type HubApplicationInput,
    type HubApplicationStatus,
} from '@/lib/hub-applications';

/** Anonymous submission from the public C2S Hub form. */
export const submitHubApplication = withPublicAction(async (input: HubApplicationInput) => {
    const application = await createHubApplication(input);
    revalidatePath('/dashboard');
    return application;
});

/** Coordinator triage — approve or reject a household's offer to host. */
export const reviewHubApplication = withC2SRole(
    ['c2s_coordinator', 'cluster_head', 'ministry_head'],
    async (user, id: string, status: HubApplicationStatus) => {
        await setHubApplicationStatus(id, status, user.name);
        revalidatePath('/dashboard');
    },
);
