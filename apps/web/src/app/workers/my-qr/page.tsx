"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuthStore } from "@studio/store";
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
  const { user } = useAuthStore();
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
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-headline font-bold">My QR Code</h1>
          <div className="flex items-center gap-2 print:hidden w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-initial">
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={refreshCodes}
              disabled={isRegenerating}
              className="flex-1 sm:flex-initial"
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

        <Card className="flex flex-col items-center justify-between text-center p-5 sm:p-8 md:p-12 bg-white dark:bg-card shadow-xl border-2 w-full max-w-full overflow-hidden">
          <CardHeader className="p-0 mb-6 sm:mb-8">
            <div className="bg-primary/5 p-3 sm:p-4 rounded-full mb-3 sm:mb-4 mx-auto w-fit">
              <QrCode className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold font-headline">
              COG App Identification
            </CardTitle>
            <CardDescription className="text-base sm:text-lg mt-1 sm:mt-2 font-medium">
              {workerProfile?.firstName} {workerProfile?.lastName}
            </CardDescription>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 capitalize">
              {workerProfile?.roleId} &bull; {workerProfile?.workerId}
            </p>
          </CardHeader>

          <CardContent className="p-0 flex justify-center w-full">
            {combinedQrUrl ? (
              <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-inner border-4 border-primary/10 inline-block overflow-hidden max-w-[260px] sm:max-w-[340px] w-full aspect-square">
                <Image
                  key={activeToken}
                  src={combinedQrUrl}
                  alt="My Unified QR Code"
                  width={340}
                  height={340}
                  unoptimized
                  className="rounded-lg w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="h-48 w-48 sm:h-64 sm:w-64 flex items-center justify-center">
                <RefreshCw className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary/30" />
              </div>
            )}
          </CardContent>

          <div className="mt-8 sm:mt-12 space-y-4 max-w-sm mx-auto w-full">
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Use this QR code for all identification purposes within the COG
              App ecosystem:
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm font-semibold">
              <div className="p-2.5 sm:p-3 bg-secondary/50 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2">
                📅 Attendance
              </div>
              <div className="p-2.5 sm:p-3 bg-secondary/50 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2">
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
