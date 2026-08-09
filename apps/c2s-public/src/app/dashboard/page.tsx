import { redirect } from 'next/navigation';
import DashboardView from '@/components/DashboardView';
import { getC2SUser } from '@/lib/auth';
import { loadDashboardData } from '@/lib/dashboard-data';

// The dashboard is per-user and always live.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const user = await getC2SUser();
    if (!user) redirect('/login');

    const data = await loadDashboardData(user);
    return <DashboardView data={data} />;
}
