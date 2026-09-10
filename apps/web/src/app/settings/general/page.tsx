"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Settings, ArrowLeft, Save, LoaderCircle } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Toggle switch ──────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={cn("relative w-11 h-6 rounded-full transition-colors shrink-0", value ? "bg-primary" : "bg-muted-foreground/25")}>
      <span className={cn("absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200", value ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ── Toggle Row ─────────────────────────────────────────────────────────────────
function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background px-4 py-3.5">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

const SETTINGS_KEY = "cog_general_settings";

interface GeneralSettings {
  appName: string;
  supportEmail: string;
  timezone: string;
  defaultLanguage: string;
  emailNotifications: boolean;
  maintenanceMode: boolean;
  auditLogging: boolean;
  weeklyPoolSize: string;
  restrictedDays: string;
  autoRollover: boolean;
}

const defaults: GeneralSettings = {
  appName: "Church of God Dasmariñas",
  supportEmail: "",
  timezone: "Asia/Manila",
  defaultLanguage: "English",
  emailNotifications: true,
  maintenanceMode: false,
  auditLogging: true,
  weeklyPoolSize: "1200",
  restrictedDays: "",
  autoRollover: false,
};

export default function GeneralSettingsPage() {
  const { canManageRoles, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GeneralSettings>(defaults);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) setSettings({ ...defaults, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const set = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      await new Promise(r => setTimeout(r, 400)); // simulate async
      toast({ title: "Settings saved", description: "Your changes have been applied." });
    } catch {
      toast({ variant: "destructive", title: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      setSettings(stored ? { ...defaults, ...JSON.parse(stored) } : defaults);
    } catch {
      setSettings(defaults);
    }
  };

  if (roleLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-7 pb-12 w-full">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary/10 shrink-0 mt-0.5">
            <Settings className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-headline tracking-tight text-foreground leading-none">General</h1>
            <div className="flex items-center justify-between gap-4 -mt-1">
              <p className="text-sm text-muted-foreground leading-none">Application name, system preferences and global defaults.</p>
              <Link href="/settings"
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border/60 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition-colors shrink-0">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Application Settings */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-base font-bold text-foreground">Application Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Core identity shown across the app.</p>
            </div>
            <div className="border-t border-border/40 pt-5 grid grid-cols-2 gap-x-6 gap-y-5">
              <Field label="Application Name" hint="Displayed in the title bar.">
                <input value={settings.appName} onChange={e => set("appName", e.target.value)}
                  className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </Field>
              <Field label="Support Email">
                <input type="email" value={settings.supportEmail} onChange={e => set("supportEmail", e.target.value)}
                  placeholder="support@church.org"
                  className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </Field>
              <Field label="Timezone" hint="Used for all logs & schedules.">
                <input value={settings.timezone} onChange={e => set("timezone", e.target.value)}
                  className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </Field>
              <Field label="Default Language">
                <input value={settings.defaultLanguage} onChange={e => set("defaultLanguage", e.target.value)}
                  className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </Field>
            </div>
          </div>

          {/* System Preferences */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-base font-bold text-foreground">System Preferences</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Behaviour of background tasks and notifications.</p>
            </div>
            <div className="border-t border-border/40 pt-5 flex flex-col gap-3">
              <ToggleRow label="Email Notifications" desc="Send digests for important events." value={settings.emailNotifications} onChange={v => set("emailNotifications", v)} />
              <ToggleRow label="Maintenance mode" desc="Temporarily disable member access." value={settings.maintenanceMode} onChange={v => set("maintenanceMode", v)} />
              <ToggleRow label="Audit Logging" desc="Record every change to the audit trail." value={settings.auditLogging} onChange={v => set("auditLogging", v)} />
            </div>
          </div>

          {/* Meal Stub Allocation — full width */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-card-dark p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-base font-bold text-foreground">Meal Stub Allocation</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Defaults applied when distributing stubs.</p>
            </div>
            <div className="border-t border-border/40 pt-5 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Weekly Pool Size" hint="Total stubs available each week.">
                  <input type="number" value={settings.weeklyPoolSize} onChange={e => set("weeklyPoolSize", e.target.value)}
                    className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </Field>
                <Field label="Restricted Days">
                  <input value={settings.restrictedDays} onChange={e => set("restrictedDays", e.target.value)}
                    placeholder="e.g. Saturday"
                    className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </Field>
              </div>
              <ToggleRow label="Auto-rollover unused stubs" desc="Carry remaining stubs to next week." value={settings.autoRollover} onChange={v => set("autoRollover", v)} />
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
              <button onClick={handleCancel}
                className="h-9 px-4 rounded-xl border border-border/60 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="h-9 px-4 flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
