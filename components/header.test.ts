import { describe, expect, it } from "vitest"

import { isHeaderNavItemActive } from "./header"

describe("isHeaderNavItemActive", () => {
  it("marks home active only for the root path", () => {
    expect(isHeaderNavItemActive("/", "/")).toBe(true)
    expect(isHeaderNavItemActive("/search", "/")).toBe(false)
  })

  it.each([
    ["/search", "/search"],
    ["/chat", "/chat"],
    ["/recommend", "/recommend"],
    ["/character-chat", "/character-chat"],
  ])("marks %s active for %s", (pathname, href) => {
    expect(isHeaderNavItemActive(pathname, href)).toBe(true)
  })

  it("marks parent nav item active for nested paths", () => {
    expect(isHeaderNavItemActive("/search/results", "/search")).toBe(true)
    expect(isHeaderNavItemActive("/character-chat/conversations", "/character-chat")).toBe(true)
  })

  it("does not match paths that only share a prefix", () => {
    expect(isHeaderNavItemActive("/recommendation-chat", "/recommend")).toBe(false)
    expect(isHeaderNavItemActive("/character", "/character-chat")).toBe(false)
  })

  it("does not mark unsupported paths active", () => {
    expect(isHeaderNavItemActive("/login", "/search")).toBe(false)
    expect(isHeaderNavItemActive("/movie/550", "/chat")).toBe(false)
  })
})
