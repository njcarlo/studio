/** Helpers for turning a YouTube URL into a video id, thumbnail, and embed URL. */

const YOUTUBE_ID_PATTERN =
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function getYoutubeVideoId(url?: string | null): string | null {
    if (!url) return null;
    const match = url.match(YOUTUBE_ID_PATTERN);
    return match ? match[1] : null;
}

/** Auto-derived thumbnail for a YouTube video URL, or null if the URL isn't YouTube. */
export function getYoutubeThumbnail(url?: string | null): string | null {
    const id = getYoutubeVideoId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/** Embeddable player URL for a YouTube video, or null if the URL isn't YouTube. */
export function getYoutubeEmbedUrl(url?: string | null): string | null {
    const id = getYoutubeVideoId(url);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
