'use client';

import { useAuth } from '@/lib/auth-context';
import type { User, UserRole } from '@/lib/auth';

function getDisplayName(user: User | null, fallbackRole?: UserRole): string {
    const role = user?.role ?? fallbackRole ?? 'mentor';
    const rawName = user?.name?.trim() ?? '';

    if (role === 'admin') {
        return rawName || 'C2S Admin';
    }
    if (role === 'ministry_head') {
        if (!rawName) return 'Pastor Ramon';
        const parts = rawName.split(/\s+/);
        if (/^pastor$/i.test(parts[0]) && parts.length >= 2) {
            return `${parts[0]} ${parts[1]}`;
        }
        return parts[0];
    }
    if (rawName) {
        return rawName.split(/\s+/)[0];
    }
    if (role === 'cluster_head') return 'Cluster Head';
    if (role === 'c2s_coordinator') return 'Coordinator';
    return 'Mentor';
}

function getRoleSubtitle(user: User | null, fallbackRole?: UserRole): string {
    const role = user?.role ?? fallbackRole ?? 'mentor';
    switch (role) {
        case 'admin':
            return 'Summary of ministry clusters, worker allocations, and church-wide growth today.';
        case 'ministry_head':
            return 'Summary of your ministry clusters, mentors, and discipleship progress today.';
        case 'cluster_head':
            return `Summary of ${user?.cluster ?? 'your cluster'} coordinators, mentors, and active groups.`;
        case 'c2s_coordinator':
            return `Overview of mentee requests, mentor assignments, and open groups in ${user?.cluster ?? 'your cluster'}.`;
        case 'mentor':
        default:
            return `Summary of ${user?.group ?? 'your mentoring group'}, lessons, and active mentees today.`;
    }
}

export default function DashboardWelcomeBanner({
    fallbackRole,
    className = '',
}: {
    fallbackRole?: UserRole;
    className?: string;
}) {
    const { user } = useAuth();
    const displayName = getDisplayName(user, fallbackRole);
    const subtitle = getRoleSubtitle(user, fallbackRole);

    return (
        <section
            aria-label="Dashboard welcome summary"
            className={`c2s-welcome-banner ${className}`.trim()}
        >
            <div className="c2s-welcome-inner">
                <h1 className="c2s-welcome-title">
                    {'Welcome back, '}
                    <span className="c2s-welcome-highlight">{displayName}!</span>
                </h1>
                <p className="c2s-welcome-subtitle">{subtitle}</p>
            </div>
        </section>
    );
}
