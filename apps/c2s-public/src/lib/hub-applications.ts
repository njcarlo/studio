import 'server-only';
import { firebaseAdminFirestore } from './firebase-admin';

/**
 * C2S Hub applications — a household offering to host a C2S group.
 *
 * These live in Firestore rather than Postgres: an application is an inbound
 * form submission that a coordinator triages, not a record the relational C2S
 * model refers to. Once approved a coordinator creates the actual C2SGroup,
 * which is where the Prisma-side lifecycle begins.
 */

const COLLECTION = 'c2sHubApplications';

export type HubApplicationStatus = 'Pending' | 'Approved' | 'Rejected';

export type HubApplication = {
    id: string;
    name: string;
    email: string;
    phone: string;
    barangay: string;
    address: string;
    /** Meeting slot the household offered, e.g. "Friday 7:00 PM". */
    schedule: string;
    /** People already in the household who would join. */
    family: number;
    /** People they believe they could invite. */
    potential: number;
    status: HubApplicationStatus;
    submittedAt: string;   // ISO
    reviewedAt: string | null;
    reviewedBy: string | null;
    clusterId: string | null;
};

export type HubApplicationInput = {
    name: string;
    email: string;
    phone: string;
    barangay: string;
    address: string;
    schedule: string;
    family?: number;
    potential?: number;
    clusterId?: string | null;
};

function collection() {
    return firebaseAdminFirestore.collection(COLLECTION);
}

type StoredHubApplication = Omit<HubApplication, 'id'>;

/** Anonymous submission from the public C2S Hub form. */
export async function createHubApplication(input: HubApplicationInput): Promise<HubApplication> {
    const record: StoredHubApplication = {
        name: input.name,
        email: input.email,
        phone: input.phone,
        barangay: input.barangay,
        address: input.address,
        schedule: input.schedule,
        family: input.family ?? 0,
        potential: input.potential ?? 0,
        status: 'Pending',
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        clusterId: input.clusterId ?? null,
    };

    const ref = await collection().add(record);
    return { id: ref.id, ...record };
}

/** Applications for a coordinator's inbox, newest first. */
export async function listHubApplications(clusterIds?: string[]): Promise<HubApplication[]> {
    const snapshot = await collection().orderBy('submittedAt', 'desc').get();

    const all = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as StoredHubApplication),
    }));

    // An application submitted before any cluster was assigned is unscoped and
    // stays visible to every coordinator, so nothing is silently dropped.
    if (!clusterIds || clusterIds.length === 0) return all;
    return all.filter((a) => a.clusterId === null || clusterIds.includes(a.clusterId));
}

export async function setHubApplicationStatus(
    id: string,
    status: HubApplicationStatus,
    reviewedBy: string,
): Promise<void> {
    await collection().doc(id).update({
        status,
        reviewedAt: new Date().toISOString(),
        reviewedBy,
    });
}
