import Link from "next/link";
import { getPublicSermons } from "@/actions/sermons";
import { format } from "date-fns";
import { BookOpen, Calendar, PlayCircle, Headphones } from "lucide-react";
import { getYoutubeThumbnail } from "@/lib/youtube";

export const metadata = {
    title: "Preaching - COG Dasma",
    description: "Browse recent preaching from COG Dasma.",
};

export default async function PublicSermonsPage() {
    const res = await getPublicSermons();
    const sermons = res.success ? res.data : [];

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
            <div className="w-full max-w-2xl py-10">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-3">
                        <BookOpen className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Preaching</h1>
                    <p className="text-gray-600 mt-1">
                        Catch up on recent messages from COG Dasma.
                    </p>
                </div>

                {sermons.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center text-muted-foreground">
                        No preaching has been published yet. Please check back later.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sermons.map((sermon) => {
                            const thumbnail = getYoutubeThumbnail(sermon.videoUrl);
                            return (
                                <div key={sermon.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                                    {thumbnail && (
                                        <Link href={`/public/sermons/${sermon.id}`}>
                                            <img
                                                src={thumbnail}
                                                alt={sermon.title}
                                                className="w-full aspect-video object-cover"
                                            />
                                        </Link>
                                    )}
                                    <div className="p-5">
                                        <h2 className="text-lg font-semibold text-gray-800">
                                            {sermon.videoUrl ? (
                                                <Link href={`/public/sermons/${sermon.id}`} className="hover:underline">
                                                    {sermon.title}
                                                </Link>
                                            ) : (
                                                sermon.title
                                            )}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="h-4 w-4" />
                                                {format(new Date(sermon.date), "EEEE, MMMM d, yyyy")}
                                            </span>
                                            {sermon.speaker && <span>{sermon.speaker}</span>}
                                            {sermon.scripture && (
                                                <span className="italic">{sermon.scripture}</span>
                                            )}
                                        </div>
                                        {sermon.description && (
                                            <p className="text-sm text-gray-600 mt-3">{sermon.description}</p>
                                        )}
                                        {(sermon.videoUrl || sermon.audioUrl) && (
                                            <div className="flex gap-4 mt-3">
                                                {sermon.videoUrl && (
                                                    <Link
                                                        href={`/public/sermons/${sermon.id}`}
                                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                                                    >
                                                        <PlayCircle className="h-4 w-4" /> Watch
                                                    </Link>
                                                )}
                                                {sermon.audioUrl && (
                                                    <a
                                                        href={sermon.audioUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                                                    >
                                                        <Headphones className="h-4 w-4" /> Listen
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
