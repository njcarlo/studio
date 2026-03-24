"use client";

import { AppLayout } from "@/components/layout/app-layout";

export default function MasterviewPage() {
  return (
    <AppLayout title="Masterview" subtitle="Reservation overview">
      <div className="p-6 rounded-lg border bg-card text-card-foreground">
        <h2 className="text-lg font-semibold">Masterview Is Being Migrated</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This screen is being migrated to Supabase/SQL-backed data sources.
        </p>
      </div>
    </AppLayout>
  );
}
