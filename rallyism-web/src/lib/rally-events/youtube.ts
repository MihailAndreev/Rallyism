export function getYoutubeThumbnailUrl(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function parseYoutubeVideoId(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
  let videoId: string | null = null;

  if (hostname === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else {
      const [prefix, id] = url.pathname.split("/").filter(Boolean);

      if (prefix === "shorts" || prefix === "embed") {
        videoId = id ?? null;
      }
    }
  }

  if (!videoId || !/^[A-Za-z0-9_-]{6,32}$/.test(videoId)) {
    return null;
  }

  return videoId;
}
