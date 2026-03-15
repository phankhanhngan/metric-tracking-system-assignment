import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockScan = vi.fn();
const mockDel = vi.fn();

vi.mock("../redis", () => ({
  getRedisClient: () => ({
    get: mockGet,
    set: mockSet,
    scan: mockScan,
    del: mockDel,
  }),
}));

import { cacheGet, chooseTTL, invalidateByPattern } from "../cache";

describe("cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cacheGet", () => {
    it("should return cached value on hit", async () => {
      mockGet.mockResolvedValue(JSON.stringify({ data: "cached" }));
      const fetchFn = vi.fn();

      const result = await cacheGet("key", fetchFn, 600);

      expect(result).toEqual({ data: "cached" });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it("should call fetchFn on cache miss and cache the result", async () => {
      mockGet.mockResolvedValue(null);
      mockSet.mockResolvedValue("OK");
      const fetchFn = vi.fn().mockResolvedValue({ data: "fresh" });

      const result = await cacheGet("key", fetchFn, 600);

      expect(result).toEqual({ data: "fresh" });
      expect(fetchFn).toHaveBeenCalledOnce();
      expect(mockSet).toHaveBeenCalledWith(
        "key",
        JSON.stringify({ data: "fresh" }),
        "EX",
        600,
      );
    });
  });

  describe("chooseTTL", () => {
    it("should return 10 minutes when no filterEnd", () => {
      expect(chooseTTL()).toBe(600);
    });

    it("should return 10 minutes when filterEnd is today or future", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(chooseTTL(tomorrow)).toBe(600);
    });

    it("should return 1 week when filterEnd is in the past", () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      expect(chooseTTL(lastWeek)).toBe(604800);
    });
  });

  describe("invalidateByPattern", () => {
    it("should scan and delete matching keys", async () => {
      mockScan
        .mockResolvedValueOnce(["10", ["key:1", "key:2"]])
        .mockResolvedValueOnce(["0", ["key:3"]]);
      mockDel.mockResolvedValue(1);

      await invalidateByPattern("key:*");

      expect(mockScan).toHaveBeenCalledTimes(2);
      expect(mockDel).toHaveBeenCalledTimes(2);
      expect(mockDel).toHaveBeenCalledWith("key:1", "key:2");
      expect(mockDel).toHaveBeenCalledWith("key:3");
    });

    it("should handle no matching keys", async () => {
      mockScan.mockResolvedValueOnce(["0", []]);

      await invalidateByPattern("nonexistent:*");

      expect(mockDel).not.toHaveBeenCalled();
    });
  });
});
