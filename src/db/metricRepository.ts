import { MetricType } from "@/common/utils/unit";
import { db } from "@/db/db";
import { sql } from "kysely";

export interface MetricRow {
	id: number;
	user_id: string;
	type: string;
	value: number;
	original_value: number;
	original_unit: string;
	date: Date;
	created_at: Date;
}

export interface ChartRow {
	day: Date;
	value: number;
}

export class MetricRepository {
	async findByUserAndType(
		userId: string,
		type: MetricType,
		limit: number,
		offset: number,
	): Promise<MetricRow[]> {
		const results = await db
			.selectFrom("metrics")
			.selectAll()
			.where("user_id", "=", userId)
			.where("type", "=", type)
			.orderBy("date", "desc")
			.limit(limit)
			.offset(offset)
			.execute();
		return results as MetricRow[];
	}

	async findChartData(
		userId: string,
		type: MetricType,
		filterStart?: Date,
		filterEnd?: Date,
	): Promise<ChartRow[]> {
		let query = sql`
			SELECT DISTINCT ON (date_trunc('day', date))
				date_trunc('day', date) AS day,
				value
			FROM metrics
			WHERE user_id = ${userId}
				AND type = ${type}`;

		if (filterStart) {
			query = sql`${query} AND date >= ${filterStart}`;
		}
		if (filterEnd) {
			query = sql`${query} AND date <= ${filterEnd}`;
		}

		query = sql`${query} ORDER BY date_trunc('day', date), date DESC`;

		const results = await sql<ChartRow>`${query}`.execute(db);
		return results.rows;
	}

	async batchInsert(
		rows: {
			user_id: string;
			type: string;
			date: Date;
			value: number;
			original_value: number;
			original_unit: string;
		}[],
	): Promise<void> {
		if (rows.length === 0) return;
		await db.insertInto("metrics").values(rows).execute();
	}
}
