import { batchInsert, type BatchMetric } from "@/app/metric/consumer/consumerService";
import { receiveMessages, deleteMessages } from "@/infra/sqs";

interface BufferConfig {
	maxMessagesPerPoll: number;
	waitSeconds: number;
}

function getEnvNumber(name: string, fallback: number): number {
	const raw = process.env[name];
	if (!raw) return fallback;
	const parsed = Number(raw);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toBatchMetric(body: unknown): BatchMetric | null {
	if (typeof body !== "object" || body === null) return null;
	const b = body as Record<string, unknown>;

	const userId = typeof b.user_id === "string" ? b.user_id : null;
	const type = typeof b.type === "string" ? b.type : null;
	const date = typeof b.date === "string" ? b.date : null;
	const value = typeof b.value === "number" ? b.value : null;
	const originalValue =
		typeof b.original_value === "number" ? b.original_value : null;
	const originalUnit =
		typeof b.original_unit === "string" ? b.original_unit : null;

	if (
		!userId ||
		!type ||
		!date ||
		value === null ||
		originalValue === null ||
		!originalUnit
	) {
		return null;
	}

	return {
		user_id: userId,
		type,
		date,
		value,
		original_value: originalValue,
		original_unit: originalUnit,
	};
}

async function pollOnce(config: BufferConfig): Promise<void> {
	const metrics: BatchMetric[] = [];
	const deleteEntries: { Id: string; ReceiptHandle: string }[] = [];

	const startedAt = Date.now();

	// Keep polling until either:
	// - we reach the configured batch size, or
	// - the configured wait window elapses.
	// This simulates how Lambda buffers messages before invoking the consumer.
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const elapsedSeconds = (Date.now() - startedAt) / 1000;
		if (elapsedSeconds >= config.waitSeconds) break;

		const remainingSlots = config.maxMessagesPerPoll - metrics.length;
		if (remainingSlots <= 0) break;

		const remainingSeconds = Math.max(
			1,
			Math.floor(config.waitSeconds - elapsedSeconds),
		);

		const messages = await receiveMessages(remainingSlots, remainingSeconds);

		if (messages.length === 0) {
			// Nothing arrived in this window; keep looping until time is over.
			continue;
		}

		for (const msg of messages) {
			if (!msg.Body) continue;

			try {
				const parsed = JSON.parse(msg.Body) as unknown;
				const metric = toBatchMetric(parsed);
				if (!metric) {
					// eslint-disable-next-line no-console
					console.warn("Skipping invalid metric message", msg.Body);
					continue;
				}

				metrics.push(metric);

				if (msg.MessageId && msg.ReceiptHandle) {
					deleteEntries.push({
						Id: msg.MessageId,
						ReceiptHandle: msg.ReceiptHandle,
					});
				}
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error("Failed to parse SQS message body", err);
			}
		}
	}

	if (metrics.length === 0) {
		// eslint-disable-next-line no-console
		console.log("No valid metric messages to process");
		return;
	}

	const count = await batchInsert(metrics);
	await deleteMessages(deleteEntries);

	// eslint-disable-next-line no-console
	console.log(
		`Processed batch: inserted ${count} metrics from ${metrics.length} messages`,
	);
}

async function main(): Promise<void> {
	const config: BufferConfig = {
		// SQS MaxNumberOfMessages must be between 1 and 10
		maxMessagesPerPoll: Math.min(
			10,
			Math.max(getEnvNumber("SQS_MAX_MESSAGES", 1000), 1),
		),
		waitSeconds: getEnvNumber("SQS_WAIT_SECONDS", 10),
	};

	// eslint-disable-next-line no-console
	console.log(
		`Starting SQS buffer worker (maxMessagesPerPoll=${config.maxMessagesPerPoll}, waitSeconds=${config.waitSeconds})`,
	);

	// eslint-disable-next-line no-constant-condition
	while (true) {
		try {
			// eslint-disable-next-line no-await-in-loop
			await pollOnce(config);
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error("Polling iteration failed", err);
		}
	}
}

void main().catch((err) => {
	// eslint-disable-next-line no-console
	console.error("SQS buffer worker failed to start", err);
	process.exitCode = 1;
});

