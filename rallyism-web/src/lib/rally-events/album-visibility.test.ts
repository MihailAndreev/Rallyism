import { describe, expect, it } from "vitest";

import {
  eventSupportsAlbumVisibilityControl,
  getDefaultAlbumVisibilityForEvent,
  getEffectiveAlbumVisibility,
} from "./album-visibility";

describe("album visibility helpers", () => {
  it("forces albums to effective private inside private events", () => {
    expect(getEffectiveAlbumVisibility("private", "public")).toBe("private");
    expect(getEffectiveAlbumVisibility("private", "private")).toBe("private");
  });

  it("keeps album visibility for public and unlisted events", () => {
    expect(getEffectiveAlbumVisibility("public", "public")).toBe("public");
    expect(getEffectiveAlbumVisibility("public", "private")).toBe("private");
    expect(getEffectiveAlbumVisibility("unlisted", "public")).toBe("public");
  });

  it("only allows album visibility selection outside private events", () => {
    expect(eventSupportsAlbumVisibilityControl("private")).toBe(false);
    expect(eventSupportsAlbumVisibilityControl("public")).toBe(true);
    expect(eventSupportsAlbumVisibilityControl("unlisted")).toBe(true);
  });

  it("defaults new albums safely based on the parent event", () => {
    expect(getDefaultAlbumVisibilityForEvent("private")).toBe("private");
    expect(getDefaultAlbumVisibilityForEvent("public")).toBe("public");
    expect(getDefaultAlbumVisibilityForEvent("unlisted")).toBe("public");
  });
});
