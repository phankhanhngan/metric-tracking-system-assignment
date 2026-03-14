import { db } from "../../../db/db";
import { invalidateByPattern } from "@/infra/cache";
import { parseISO } from "@/common/utils/dateUtils";
import { logger } from "@/consumerApp";

export interface BatchMetric {
	user_id: string;
	type: string;
	date: string;
	value: number;
	original_value: number;
	original_unit: string;
}

export async function batchInsert(metrics: BatchMetric[]): Promise<number> {
	if (metrics.length === 0) return 0;

	const rows = metrics.map((m) => ({
		user_id: m.user_id,
		type: m.type,
		date: parseISO(m.date),
		value: m.value,
		original_value: m.original_value,
		original_unit: m.original_unit,
	}));

	await db.insertInto("metrics").values(rows).execute();

	// Invalidate cache for affected user+type combos
	const affected = new Set(metrics.map((m) => `${m.user_id}:${m.type}`));
	const invalidations = Array.from(affected).map((key) =>
		invalidateByPattern(`metrics:*:${key}:*`),
	);
	Promise.all(invalidations).catch(err => {
		logger.warn(`Failed to invalidate metrics cache for key: ${affected}`)
	});

	return metrics.length;
}
