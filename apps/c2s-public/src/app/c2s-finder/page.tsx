import C2SFinderView from '@/components/C2SFinderView';
import { loadPublicGroups } from '@/lib/dashboard-data';

// Group data is live, so this page renders per request rather than at build time.
export const dynamic = 'force-dynamic';

export default async function C2SFinderPage() {
    const groups = await loadPublicGroups();
    return <C2SFinderView groups={groups} />;
}
