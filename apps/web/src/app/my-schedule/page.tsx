import { redirect } from "next/navigation";

export default function MySchedulePageRedirect() {
    redirect("/worker/schedule");
}
