"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Package } from "lucide-react";

export default function InventoryPage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 bg-primary/10 rounded-full">
          <Package className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-muted-foreground text-lg">Coming Soon</p>
        <p className="text-muted-foreground text-sm max-w-sm">
          This feature is currently under development. Check back later.
        </p>
      </div>
    </AppLayout>
  );
}
