"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useUser } from "@studio/database";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@studio/ui";
import { Button } from "@studio/ui";
import { QrCode, RefreshCw, Download, Printer } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useUserRole } from "@/hooks/use-user-role";
import { updateWorker as updateWorkerSql } from "@/actions/db";
import { useToast } from "@/hooks/use-toast";

export default function MyQRCodePage() {
  const { user } = useUser();
  const { workerProfile } = useUserRole();
  const { toast } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [localToken, setLocalToken] = useState<string | null>(null);

  const activeUserId = workerProfile?.id || user?.uid;
  const activeToken =
    localToken ?? workerProfile?.qrToken ?? activeUserId ?? "";
  const combinedData = activeToken
    ? `COG_USER:${activeUserId}:${activeToken}`
    : "";
  const combinedQrUrl = combinedData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(combinedData)}`
    : "";

  const refreshCodes = async () => {
    if (!workerProfile) return;
    setIsRegenerating(true);
    try {
      const newToken =
        Math.random().toString(36).slice(2) + Date.now().toString(36);

      await (updateWorkerSql as any)(workerProfile.id, { qrToken: newToken });

      setLocalToken(newToken);
      toast({
        title: "QR Code regenerated",
        description: "Your identification token has been securely updated.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Regeneration failed",
        description: "Could not update your QR token. Please try again.",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-headline font-bold">My QR Code</h1>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={refreshCodes}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Regenerate
            </Button>
          </div>
        </div>

        <Card className="flex flex-col items-center justify-between text-center p-12 bg-white shadow-xl border-2">
          <CardHeader className="p-0 mb-8">
            <div className="bg-primary/5 p-4 rounded-full mb-4 mx-auto w-fit">
              <QrCode className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold font-headline">
              COG App Identification
            </CardTitle>
            <CardDescription className="text-lg mt-2 font-medium">
              {workerProfile?.firstName} {workerProfile?.lastName}
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              {workerProfile?.roleId} &bull; {workerProfile?.workerId}
            </p>
          </CardHeader>

          <CardContent className="p-0">
            {combinedQrUrl ? (
              <div className="bg-white p-6 rounded-2xl shadow-inner border-4 border-primary/10 inline-block overflow-hidden">
                <Image
                  key={activeToken}
                  src={combinedQrUrl}
                  alt="My Unified QR Code"
                  width={400}
                  height={400}
                  unoptimized
                  className="rounded-lg scale-110"
                />
              </div>
            ) : (
              <div className="h-64 w-64 flex items-center justify-center">
                <RefreshCw className="h-12 w-12 animate-spin text-primary/30" />
              </div>
            )}
          </CardContent>

          <div className="mt-12 space-y-4 max-w-sm mx-auto">
            <p className="text-base text-muted-foreground leading-relaxed">
              Use this QR code for all identification purposes within the COG
              App ecosystem:
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
              <div className="p-3 bg-secondary/50 rounded-lg flex items-center justify-center gap-2">
                📅 Attendance
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg flex items-center justify-center gap-2">
                🍽️ Meal Stubs
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center text-xs text-muted-foreground opacity-50 uppercase tracking-widest mt-8 font-bold">
          Property of Church Operations and Governance
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .sidebar-container,
          header,
          nav,
          button,
          .print\\:hidden {
            display: none !important;
          }
          body {
            background-color: white !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .animate-in {
            animation: none !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}
