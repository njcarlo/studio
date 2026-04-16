'use client';

import dynamic from 'next/dynamic';

const InventoryApp = dynamic(
    () => import('./InventoryApp').then(m => m.InventoryApp),
    { ssr: false, loading: () => <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div> }
);

export function ClientPage() {
    return <InventoryApp />;
}
