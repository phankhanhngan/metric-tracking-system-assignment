import { MetricType, toBase } from "@/common/utils/unit";
import { publishMessage } from "@/infra/sqs";

export interface CollectorInput {
	userId: string;
	type: MetricType;
	value: number;
	unit: string;
	date: string;
}

export async function collectMetric(input: CollectorInput): Promise<void> {
	const baseValue = toBase(input.value, input.unit);

	await publishMessage({
		user_id: input.userId,
		type: input.type,
		date: input.date,
		value: baseValue,
		original_value: input.value,
		original_unit: input.unit,
	});
}
