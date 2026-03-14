import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectMetric } from "../collectorService";
import { randomUUID } from "node:crypto";

vi.mock("@/infra/sqs", () => ({
	publishMessage: vi.fn(),
}));

import { publishMessage } from "@/infra/sqs";

describe("collectorService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should convert distance to base unit (meter) and publish to SQS", async () => {
		const userId = randomUUID()
		await collectMetric({
			userId: userId,
			type: "distance",
			value: 100,
			unit: "centimeter",
			date: "2026-03-14T10:00:00Z",
		});

		expect(publishMessage).toHaveBeenCalledWith({
			user_id: userId,
			type: "distance",
			date: "2026-03-14T10:00:00Z",
			value: 1, // 100cm = 1m
			original_value: 100,
			original_unit: "centimeter",
		});
	});

	it("should convert temperature to base unit (C) and publish to SQS", async () => {
		const userId = randomUUID()
		await collectMetric({
			userId: userId,
			type: "temperature",
			value: 212,
			unit: "F",
			date: "2026-03-14T10:00:00Z",
		});

		expect(publishMessage).toHaveBeenCalledWith({
			user_id: userId,
			type: "temperature",
			date: "2026-03-14T10:00:00Z",
			value: 100, // 212F = 100C
			original_value: 212,
			original_unit: "F",
		});
	});

	it("should keep base unit values unchanged", async () => {
		await collectMetric({
			userId: "user-3",
			type: "distance",
			value: 5,
			unit: "meter",
			date: "2026-03-14T10:00:00Z",
		});

		expect(publishMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				value: 5,
				original_value: 5,
				original_unit: "meter",
			}),
		);
	});

	it("should convert feet to meters correctly", async () => {
		await collectMetric({
			userId: "user-4",
			type: "distance",
			value: 328.08,
			unit: "feet",
			date: "2026-03-14T10:00:00Z",
		});

		const call = vi.mocked(publishMessage).mock.calls[0][0] as Record<string, unknown>;
		expect(call.value).toBeCloseTo(99.99, 1);
		expect(call.original_value).toBe(328.08);
		expect(call.original_unit).toBe("feet");
	});
});
