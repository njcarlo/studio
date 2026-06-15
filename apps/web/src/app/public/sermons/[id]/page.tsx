import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Headphones } from "lucide-react";
import { getPublicSermon } from "@/actions/sermons";
import { getYoutubeEmbedUrl } from "@/lib/youtube";

export default async function PublicSermonDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const res = await getPublicSermon(id);
    if (!res.success) notFound();
    const sermon = res.data;

    const embedUrl = getYoutubeEmbedUrl(sermon.videoUrl);

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
            <div className="w-full max-w-2xl py-10">
                <Link
                    href="/public/sermons"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Preaching
                </Link>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {embedUrl ? (
                        <div className="aspect-video w-full">
                            <iframe
                                src={embedUrl}
                                title={sermon.title}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    ) : sermon.videoUrl ? (
                        <div className="p-5">
                            <a
                                href={sermon.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                Watch video
                            </a>
                        </div>
                    ) : null}

                    <div className="p-5">
                        <h1 className="text-xl font-semibold text-gray-800">{sermon.title}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(sermon.date), "EEEE, MMMM d, yyyy")}
                            </span>
                            {sermon.speaker && <span>{sermon.speaker}</span>}
                            {sermon.scripture && <span className="italic">{sermon.scripture}</span>}
                        </div>
                        {sermon.description && (
                            <p className="text-sm text-gray-600 mt-3">{sermon.description}</p>
                        )}
                        {sermon.audioUrl && (
                            <a
                                href={sermon.audioUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-3"
                            >
                                <Headphones className="h-4 w-4" /> Listen to audio
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
