import { describe, expect, it } from "vitest";

describe("frontend smoke test", () => {
  it("runs basic assertion", () => {
    expect(1 + 1).toBe(2);
  });
});
