import { redirect } from "next/navigation";

export default async function PublicScheduleTokenRedirect({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    redirect(`/worker/schedule/${token}`);
}
