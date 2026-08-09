import GroupFinderView from '@/components/GroupFinderView';
import { loadPublicGroups } from '@/lib/dashboard-data';

// Group data is live, so this page renders per request rather than at build time.
export const dynamic = 'force-dynamic';

export default async function GroupFinderPage() {
    const groups = await loadPublicGroups();
    return <GroupFinderView groups={groups} />;
}
