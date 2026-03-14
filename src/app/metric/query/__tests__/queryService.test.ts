import { describe, it, expect, vi, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";

const { mockFindByUserAndType, mockFindChartData } = vi.hoisted(() => ({
	mockFindByUserAndType: vi.fn(),
	mockFindChartData: vi.fn(),
}));

vi.mock("@/db/metricRepository", () => ({
	MetricRepository: vi.fn().mockImplementation(() => ({
		findByUserAndType: mockFindByUserAndType,
		findChartData: mockFindChartData,
	})),
}));

vi.mock("@/infra/cache", () => ({
	cacheGet: vi.fn(async (_key: string, fetchFn: () => Promise<unknown>, _ttl: number) => fetchFn()),
	chooseTTL: vi.fn().mockReturnValue(600),
}));

import { listMetrics, getChartData } from "../queryService";

describe("queryService", () => {
	beforeEach(() => {
		mockFindByUserAndType.mockClear();
		mockFindChartData.mockClear();
	});

	describe("listMetrics", () => {
		it("should return metrics in base unit when no target unit specified", async () => {
			mockFindByUserAndType.mockResolvedValue([
				{
					id: 1,
					user_id: randomUUID(),
					type: "distance",
					value: 100,
					original_value: 10000,
					original_unit: "centimeter",
					date: new Date("2026-03-14T10:00:00Z"),
					created_at: new Date(),
				},
			]);

			const result = await listMetrics(randomUUID(), "distance", 50, 0);

			expect(result.success).toBe(true);
			expect(result.responseObject).toHaveLength(1);
			expect(result.responseObject[0].value).toBe(100);
			expect(result.responseObject[0].unit).toBe("meter");
			expect(result.responseObject[0].originalUnit).toBe("centimeter");
			expect(result.responseObject[0].originalValue).toBe(10000);
		});

		it("should convert to target unit when specified", async () => {
			mockFindByUserAndType.mockResolvedValue([
				{
					id: 1,
					user_id: randomUUID(),
					type: "distance",
					value: 1,
					original_value: 100,
					original_unit: "centimeter",
					date: new Date("2026-03-14T10:00:00Z"),
					created_at: new Date(),
				},
			]);

			const result = await listMetrics(randomUUID(), "distance", 50, 0, "centimeter");

			expect(result.success).toBe(true);
			expect(result.responseObject[0].value).toBe(100);
			expect(result.responseObject[0].unit).toBe("centimeter");
		});

		it("should pass limit and offset to repository", async () => {
			mockFindByUserAndType.mockResolvedValue([]);

			const userId = randomUUID();

			await listMetrics(userId, "distance", 10, 20);

			expect(mockFindByUserAndType).toHaveBeenCalledWith(userId, "distance", 10, 20);
		});
	});

	describe("getChartData", () => {
		it("should return chart data in base unit", async () => {
			mockFindChartData.mockResolvedValue([
				{
					day: new Date("2026-03-14T00:00:00Z"),
					value: 100,
				},
			]);

			const result = await getChartData(randomUUID(), "distance");

			expect(result.success).toBe(true);
			expect(result.responseObject).toHaveLength(1);
			expect(result.responseObject[0].date).toBe("2026-03-14");
			expect(result.responseObject[0].value).toBe(100);
			expect(result.responseObject[0].unit).toBe("meter");
		});

		it("should convert chart data to target unit", async () => {
			mockFindChartData.mockResolvedValue([
				{
					day: new Date("2026-03-14T00:00:00Z"),
					value: 0,
				},
			]);

			const result = await getChartData(randomUUID(), "temperature", undefined, undefined, "F");

			expect(result.success).toBe(true);
			expect(result.responseObject[0].value).toBe(32);
			expect(result.responseObject[0].unit).toBe("F");
		});

		it("should handle errors gracefully", async () => {
			mockFindChartData.mockRejectedValue(new Error("DB error"));

			const result = await getChartData(randomUUID(), "distance");

			expect(result.success).toBe(false);
			expect(result.statusCode).toBe(500);
		});
	});
});
