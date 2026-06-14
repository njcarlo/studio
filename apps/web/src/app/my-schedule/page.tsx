"use client";

import { format } from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@studio/ui";
import { CalendarDays, CheckCircle2, XCircle, Clock, LoaderCircle, Ticket } from "lucide-react";
import { useMySchedule } from "@/hooks/use-schedule";
import { useMinistries } from "@/hooks/use-ministries";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuthStore } from "@studio/store";
import { useToast } from "@/hooks/use-toast";
import { isWithinConfirmationWindow } from "@/lib/scheduling/confirmation-window";

export default function MySchedulePage() {
    const { toast } = useToast();
    const { user } = useAuthStore();
    const { workerProfile } = useUserRole();
    const { assignments, isLoading, stubCounts, confirmationWindow, confirmAssignment, setAttendanceStatus } = useMySchedule(workerProfile?.id);
    const { ministries } = useMinistries();

    const ministryName = (id: string) => ministries.find((m: any) => m.id === id)?.name || id;

    const handleConfirm = async (assignmentId: string) => {
        try {
            const result = await confirmAssignment({ assignmentId, confirmedBy: workerProfile?.id || user?.uid || 'system' });
            if (result?.stubsIssued) {
                toast({ title: "Confirmed", description: `You're confirmed for this assignment. 🎫 ${result.stubsIssued} meal stub(s) issued.` });
            } else {
                toast({ title: "Confirmed", description: "You're confirmed for this assignment." });
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    const handleDecline = async (assignmentId: string) => {
        try {
            await setAttendanceStatus({ assignmentId, status: 'Not Attending', updatedBy: workerProfile?.id || user?.uid || 'system' });
            toast({ title: "Declined", description: "You've been marked as not attending." });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    return (
        <AppLayout>
            <div className="flex flex-col gap-6 p-4 md:p-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Schedule</h1>
                    <p className="text-muted-foreground">Your upcoming assignments. Confirm if you can serve, or let us know if you can't make it.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : assignments.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <CalendarDays className="mx-auto mb-3 h-8 w-8" />
                            You have no upcoming assignments.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {assignments.map((a: any) => {
                            const status = a.attendanceStatus || 'Pending';
                            const slotType = a.slotType || 'Standard';
                            const awaitingApproval = a.approvalStatus === 'Pending';
                            const stubsForThis = stubCounts?.[a.scheduleId] ?? 0;
                            const withinWindow = confirmationWindow && a.schedule?.date
                                ? isWithinConfirmationWindow(a.schedule.date, new Date(), confirmationWindow)
                                : true;
                            return (
                                <Card key={a.id}>
                                    <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                                        <div>
                                            <CardTitle className="text-base">
                                                {a.schedule?.title || 'Sunday Service'}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                {a.schedule?.date ? format(new Date(a.schedule.date), "EEEE, MMMM d, yyyy") : ""}
                                            </p>
                                        </div>
                                        {status === 'Confirmed' && (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmed
                                            </Badge>
                                        )}
                                        {status === 'Not Attending' && (
                                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                                <XCircle className="mr-1 h-3 w-3" /> Not Attending
                                            </Badge>
                                        )}
                                        {status === 'Pending' && !awaitingApproval && (
                                            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                                                <Clock className="mr-1 h-3 w-3" /> Pending
                                            </Badge>
                                        )}
                                        {awaitingApproval && (
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                                <Clock className="mr-1 h-3 w-3" /> Awaiting Approval
                                            </Badge>
                                        )}
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-3">
                                        <div className="flex flex-wrap items-center gap-2 text-sm">
                                            <Badge variant="outline">{ministryName(a.ministryId)}</Badge>
                                            <span className="font-medium">{a.roleName}</span>
                                        </div>

                                        {a.rehearsalDate && (
                                            <p className="text-sm text-muted-foreground">
                                                Rehearsal: {format(new Date(a.rehearsalDate), "MMM d, yyyy")}
                                                {a.rehearsalTime ? ` at ${a.rehearsalTime}` : ""}
                                            </p>
                                        )}

                                        {a.notes && (
                                            <p className="text-sm text-muted-foreground">{a.notes}</p>
                                        )}

                                        {stubsForThis > 0 && (
                                            <Badge variant="outline" className="w-fit bg-amber-50 text-amber-700 border-amber-200">
                                                <Ticket className="mr-1 h-3 w-3" /> {stubsForThis} meal stub{stubsForThis > 1 ? "s" : ""} issued
                                            </Badge>
                                        )}

                                        {status === 'Confirmed' && slotType === 'Open' && stubsForThis === 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                This is an Open slot — confirm your assignment for the paired Sunday to activate your meal stub.
                                            </p>
                                        )}

                                        {awaitingApproval && (
                                            <p className="text-xs text-muted-foreground">
                                                This assignment is in your minor ministry and is awaiting approval from the Ministry Head.
                                            </p>
                                        )}

                                        {!withinWindow && status !== 'Confirmed' && status !== 'Not Attending' && (
                                            <p className="text-xs text-muted-foreground">Confirmation window is closed for this service.</p>
                                        )}

                                        {!awaitingApproval && status !== 'Confirmed' && status !== 'Not Attending' && (
                                            <div className="flex gap-2 pt-1">
                                                <Button size="sm" onClick={() => handleConfirm(a.id)} disabled={!withinWindow}>
                                                    <CheckCircle2 className="mr-1 h-4 w-4" /> Confirm
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleDecline(a.id)} disabled={!withinWindow}>
                                                    <XCircle className="mr-1 h-4 w-4" /> Decline
                                                </Button>
                                            </div>
                                        )}

                                        {status === 'Not Attending' && (
                                            <div className="pt-1">
                                                <Button size="sm" variant="outline" onClick={() => handleConfirm(a.id)} disabled={!withinWindow}>
                                                    <CheckCircle2 className="mr-1 h-4 w-4" /> Actually, I can serve
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
