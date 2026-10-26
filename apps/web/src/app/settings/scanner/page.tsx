"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import {
    ScanLine, ArrowLeft, Save, LoaderCircle, CheckCircle2,
    Lock, KeyRound, Eye, EyeOff, RotateCcw, ShieldCheck,
    Smartphone, ExternalLink, Sparkles, AlertCircle
} from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useScannerSettings } from "@/hooks/use-scanner-settings";
import { DEFAULT_SCANNER_SETTINGS, type ScannerSettings } from "@/lib/scanner-config";
import { Button, Badge, Card } from "@studio/ui";
import { cn } from "@/lib/utils";

// ── Toggle Switch ──────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!value)}
            className={cn(
                "relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sidebar/20",
                value ? "bg-sidebar dark:bg-sky-600" : "bg-muted-foreground/25"
            )}
        >
            <span
                className={cn(
                    "absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                    value ? "translate-x-6" : "translate-x-1"
                )}
            />
        </button>
    );
}

export default function ScannerSettingsPage() {
    const { canManageRoles, isLoading: roleLoading } = useUserRole();
    const { toast } = useToast();
    const { settings, isLoading, updateSettings, isSaving } = useScannerSettings();

    const [form, setForm] = useState<ScannerSettings>(DEFAULT_SCANNER_SETTINGS);
    const [showPassword, setShowPassword] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    useEffect(() => {
        if (settings) {
            setForm(settings);
        }
    }, [settings]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.lockPassword.trim()) {
            toast({
                variant: "destructive",
                title: "Password Required",
                description: "Scanner lock password cannot be empty.",
            });
            return;
        }

        try {
            await updateSettings(form);
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
            toast({
                title: "Scanner Configuration Saved",
                description: "New scanner password and security rules have been updated successfully.",
            });
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: err.message || "Could not save scanner settings.",
            });
        }
    };

    const handleResetDefaults = () => {
        setForm(DEFAULT_SCANNER_SETTINGS);
        toast({
            title: "Reset to Defaults",
            description: "Default password 'CogMain123' and settings restored. Click Save to apply.",
        });
    };

    if (roleLoading || isLoading) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <LoaderCircle className="h-8 w-8 animate-spin text-sidebar" />
                    <p className="text-sm text-muted-foreground">Loading scanner configuration...</p>
                </div>
            </AppLayout>
        );
    }

    if (!canManageRoles) {
        return (
            <AppLayout>
                <div className="p-8 max-w-lg mx-auto text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                        <Lock className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-bold font-headline">Access Restricted</h2>
                    <p className="text-sm text-muted-foreground">
                        Only administrators have permission to modify scanner security and passwords.
                    </p>
                    <Link href="/settings">
                        <Button variant="outline" size="sm" className="mt-2">Back to Settings</Button>
                    </Link>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex flex-col space-y-6 pb-12 w-full max-w-5xl mx-auto">
                {/* ── HEADER ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="space-y-0.5 sm:space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight text-foreground">
                                Scanner Configuration
                            </h1>
                            <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase border-sidebar/30 text-sidebar">
                                Admin Security
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Configure master lock passwords, authentication rules, and preferences for attendance and meal stub scanners.
                        </p>
                    </div>
                    <Link
                        href="/settings"
                        className="flex items-center gap-1.5 h-9 px-3.5 sm:px-4 rounded-xl border border-border/60 bg-white dark:bg-card text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors shrink-0 shadow-2xs self-end sm:self-auto sm:ml-auto"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to Configurations
                    </Link>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Left 2 Columns: Main Settings */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* ── CARD 1: PASSWORD & ACCESS ── */}
                        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-xs overflow-hidden">
                            <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/[0.12] flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 flex items-center justify-center shrink-0 border border-sidebar/20">
                                        <KeyRound className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold font-headline text-foreground">Scanner Password</h2>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">Password used to unlock kiosk scanners and lock them.</p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetDefaults}
                                    className="text-xs font-semibold text-foreground bg-white dark:bg-card hover:bg-muted/40 border border-border/60 rounded-xl flex items-center gap-1.5 h-8 px-3 shadow-2xs transition-colors cursor-pointer shrink-0"
                                >
                                    <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" /> Reset Default
                                </Button>
                            </div>

                            <div className="p-4 sm:p-5 space-y-5">
                                {/* Lock Password Input */}
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Lock className="h-3.5 w-3.5 text-sidebar" /> Master Scanner Password
                                        </span>
                                        <span className="text-[11px] text-muted-foreground font-normal">Case-sensitive</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={form.lockPassword}
                                            onChange={(e) => setForm(prev => ({ ...prev, lockPassword: e.target.value }))}
                                            placeholder="Enter scanner password"
                                            required
                                            className="h-10 w-full rounded-xl border border-border/70 bg-muted/[0.15] focus:bg-background px-3.5 pr-10 text-sm font-mono focus:border-sidebar/60 focus:ring-2 focus:ring-sidebar/20 transition-all text-foreground"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                            tabIndex={-1}
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Workers or kiosk operators must type this password to unlock or lock the scanner interface.
                                    </p>
                                </div>

                                {/* Backup Admin Passwords Toggle */}
                                <div className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-muted/[0.08] flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-foreground">Allow Fallback Recovery Passwords</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Allow backup codes (<code className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">CogMain123</code>, <code className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">2026</code>) in case custom password is forgotten.
                                        </p>
                                    </div>
                                    <Toggle
                                        value={form.allowFallbackPasswords ?? true}
                                        onChange={(val) => setForm(prev => ({ ...prev, allowFallbackPasswords: val }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── CARD 2: SCANNER BEHAVIOR ── */}
                        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-xs overflow-hidden">
                            <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/[0.12] flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 flex items-center justify-center shrink-0 border border-sidebar/20">
                                    <ScanLine className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold font-headline text-foreground">Scanner Operational Rules</h2>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Timers and interface security rules.</p>
                                </div>
                            </div>

                            <div className="p-4 sm:p-5 space-y-4">
                                {/* Auto Reset Seconds */}
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Auto-Reset Countdown Delay (Seconds)
                                    </label>
                                    <input
                                        type="number"
                                        min="2"
                                        max="30"
                                        value={form.autoResetSeconds}
                                        onChange={(e) => setForm(prev => ({ ...prev, autoResetSeconds: parseInt(e.target.value, 10) || 5 }))}
                                        required
                                        className="h-10 w-full rounded-xl border border-border/70 bg-muted/[0.15] focus:bg-background px-3.5 text-sm font-mono focus:border-sidebar/60 focus:ring-2 focus:ring-sidebar/20 transition-all text-foreground"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        How many seconds the success feedback screen remains visible before automatically resetting back to the live camera.
                                    </p>
                                </div>

                                {/* Require password to lock */}
                                <div className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-muted/[0.08] flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-foreground">Require Password to Lock Scanner</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            When enabled, clicking the Lock button prompts for the password to confirm locking.
                                        </p>
                                    </div>
                                    <Toggle
                                        value={form.requirePasswordToLock}
                                        onChange={(val) => setForm(prev => ({ ...prev, requirePasswordToLock: val }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right 1 Column: Summary & Quick Actions */}
                    <div className="space-y-6">
                        {/* Save Action Card */}
                        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-xs p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                <h3 className="text-sm font-bold font-headline text-foreground">Save Configuration</h3>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Changes are immediately applied to all active kiosk scanner stations without needing server restart.
                            </p>

                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="w-full h-11 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white font-bold text-sm shadow-sm gap-2 cursor-pointer transition-all"
                            >
                                {isSaving ? (
                                    <>
                                        <LoaderCircle className="h-4 w-4 animate-spin" /> Saving Changes...
                                    </>
                                ) : savedSuccess ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 text-white" /> Changes Saved!
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" /> Save Scanner Settings
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Quick Links Card */}
                        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-xs p-5 space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kiosk Scanners</h3>
                            <div className="space-y-2">
                                <Link
                                    href="/attendance/scanner"
                                    target="_blank"
                                    className="p-3 rounded-xl border border-border/60 hover:border-sidebar/40 hover:bg-muted/30 transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                            <ScanLine className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground group-hover:text-sidebar transition-colors">Attendance Scanner</p>
                                            <p className="text-[10px] text-muted-foreground">Time In / Time Out Kiosk</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-sidebar group-hover:translate-x-0.5 transition-all" />
                                </Link>

                                <Link
                                    href="/mealstub/scanner"
                                    target="_blank"
                                    className="p-3 rounded-xl border border-border/60 hover:border-sidebar/40 hover:bg-muted/30 transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                            <ScanLine className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground group-hover:text-sidebar transition-colors">Meal Stub Scanner</p>
                                            <p className="text-[10px] text-muted-foreground">Worker Meal Verification</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-sidebar group-hover:translate-x-0.5 transition-all" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
