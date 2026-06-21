import { redirect } from "next/navigation";

export default function MySchedulePublishedRedirect() {
    redirect("/worker/schedule/published");
}
