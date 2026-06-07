import { describe, expect, it } from "vitest";

import { getYoutubeThumbnailUrl, parseYoutubeVideoId } from "./youtube";

describe("YouTube URL helpers", () => {
  it("parses normal watch URLs", () => {
    expect(
      parseYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("parses youtu.be URLs", () => {
    expect(parseYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("parses shorts URLs", () => {
    expect(
      parseYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("ignores extra query parameters", () => {
    expect(
      parseYoutubeVideoId(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&feature=share",
      ),
    ).toBe("dQw4w9WgXcQ");
  });

  it("rejects invalid URLs", () => {
    expect(parseYoutubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ")).toBe(
      null,
    );
    expect(parseYoutubeVideoId("not a url")).toBe(null);
  });

  it("builds YouTube thumbnail URLs", () => {
    expect(getYoutubeThumbnailUrl("dQw4w9WgXcQ")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
  });
});
