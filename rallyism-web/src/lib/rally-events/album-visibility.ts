export type AlbumVisibility = "private" | "public";
export type EventAlbumVisibility = AlbumVisibility | "unlisted";

export function getEffectiveAlbumVisibility(
  eventVisibility: EventAlbumVisibility,
  albumVisibility: AlbumVisibility,
): AlbumVisibility {
  return eventVisibility === "private" ? "private" : albumVisibility;
}

export function eventSupportsAlbumVisibilityControl(
  eventVisibility: EventAlbumVisibility,
) {
  return eventVisibility !== "private";
}

export function getDefaultAlbumVisibilityForEvent(
  eventVisibility: EventAlbumVisibility,
): AlbumVisibility {
  return eventSupportsAlbumVisibilityControl(eventVisibility)
    ? "public"
    : "private";
}
