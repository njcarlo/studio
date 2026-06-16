import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase-server";
import { getWorkerById, getWorkerByEmail } from "@/actions/db";
import { AppLayout } from "@/components/layout/app-layout";
import { DashboardClient } from "./DashboardClient";

const SUPER_ADMIN_EMAILS = new Set(["admin@system.com", "pacleb@gmail.com"]);

function hasSuperAdminRole(worker: any): boolean {
  if (!worker) return false;
  if (worker.roles?.some((wr: any) => wr.role?.isSuperAdmin)) return true;
  if (worker.role?.isSuperAdmin) return true;
  if (worker.role?.id === "admin" || worker.roleId === "admin") return true;
  return false;
}

/**
 * Server Component — renders before any client JS executes.
 *
 * Pre-fetches the user's first name and super-admin status so the greeting
 * and top-level widgets appear in the initial HTML, not after Zustand hydrates.
 * Middleware already handles the auth redirect, but we still check here as a
 * belt-and-suspenders guard for edge cases.
 */
export default async function DashboardPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  // Fetch in parallel: profile lookup by ID first, fall back to email
  const profile = (await getWorkerById(user.id)) ?? (await getWorkerByEmail(user.email));

  const firstName =
    profile?.firstName || user.email.split("@")[0] || "there";

  const serverIsSuperAdmin =
    SUPER_ADMIN_EMAILS.has(user.email.toLowerCase()) ||
    hasSuperAdminRole(profile);

  return (
    <AppLayout>
      <DashboardClient
        firstName={firstName}
        serverIsSuperAdmin={serverIsSuperAdmin}
      />
    </AppLayout>
  );
}
