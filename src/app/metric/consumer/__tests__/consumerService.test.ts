import { describe, it, expect, vi, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";

const { mockExecute, mockValues, mockInsertInto, mockInvalidate } = vi.hoisted(() => {
	const mockExecute = vi.fn().mockResolvedValue(undefined);
	const mockValues = vi.fn().mockReturnValue({ execute: mockExecute });
	const mockInsertInto = vi.fn().mockReturnValue({ values: mockValues });
	const mockInvalidate = vi.fn().mockResolvedValue(undefined);
	return { mockExecute, mockValues, mockInsertInto, mockInvalidate };
});

vi.mock("../../../db/db", () => ({
	db: { insertInto: mockInsertInto },
}));

vi.mock("@/infra/cache", () => ({
	invalidateByPattern: mockInvalidate,
}));

import { batchInsert } from "../consumerService";

describe("batchService", () => {
	beforeEach(() => {
		mockExecute.mockClear();
		mockValues.mockClear();
		mockInsertInto.mockClear();
		mockInvalidate.mockClear();
	});

	it("should insert metrics into the database", async () => {
		const metrics = [
			{
				user_id: randomUUID(),
				type: "distance",
				date: "2026-03-14T10:00:00Z",
				value: 100,
				original_value: 328.08,
				original_unit: "feet",
			},
		];

		const count = await batchInsert(metrics);

		expect(count).toBe(1);
	});

	it("should invalidate cache for affected user+type combos", async () => {
		const user1Id =randomUUID()
		const user2Id = randomUUID()
		const metrics = [
			{
				user_id: user1Id,
				type: "distance",
				date: "2026-03-14T10:00:00Z",
				value: 1,
				original_value: 100,
				original_unit: "centimeter",
			},
			{
				user_id: user1Id,
				type: "distance",
				date: "2026-03-14T11:00:00Z",
				value: 2,
				original_value: 200,
				original_unit: "centimeter",
			},
			{
				user_id: user2Id,
				type: "temperature",
				date: "2026-03-14T10:00:00Z",
				value: 100,
				original_value: 212,
				original_unit: "F",
			},
		];

		await batchInsert(metrics);

		expect(mockInvalidate).toHaveBeenCalledTimes(2);
		expect(mockInvalidate).toHaveBeenCalledWith(`metrics:*:${user1Id}:distance:*`);
		expect(mockInvalidate).toHaveBeenCalledWith(`metrics:*:${user2Id}:temperature:*`);
	});

	it("should return 0 and skip DB call for empty array", async () => {
		const count = await batchInsert([]);

		expect(count).toBe(0);
		expect(mockInsertInto).not.toHaveBeenCalled();
	});
});
