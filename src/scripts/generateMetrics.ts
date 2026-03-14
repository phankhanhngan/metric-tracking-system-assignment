import { randomUUID } from "node:crypto";
import { collectMetric, type CollectorInput } from "@/app/metric/collector/collectorService";
import { type MetricType, MetricTypes, unitsByType } from "@/common/utils/unit";
import { toISO } from "@/common/utils/dateUtils";

interface LoadGeneratorConfig {
	metricsPerBatch: number;
	intervalMs: number;
	userIds: string[];
	types: MetricType[];
}

function getEnvNumber(name: string, fallback: number): number {
	const raw = process.env[name];
	if (!raw) return fallback;
	const parsed = Number(raw);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getEnvList(name: string, fallback: string[]): string[] {
	const raw = process.env[name];
	if (!raw) return fallback;
	const items = raw
		.split(",")
		.map((v) => v.trim())
		.filter((v) => v.length > 0);
	return items.length > 0 ? items : fallback;
}

function randomItem<T>(items: readonly T[]): T {
	const idx = Math.floor(Math.random() * items.length);
	return items[idx] as T;
}

function randomValue(type: MetricType): number {
	if (type === "distance") {
		// 0.1 m to 10 km
		return Number((Math.random() * 10_000 + 0.1).toFixed(2));
	}

	// temperature
	return Number((Math.random() * 40 - 10).toFixed(2)); // -10°C to 30°C
}

function randomDateInLastYear(): string {
	const now = Date.now();
	const oneYearMs = 365 * 24 * 60 * 60 * 1000;
	const randomOffset = Math.random() * oneYearMs;
	const date = new Date(now - randomOffset);
	return toISO(date);
}

async function generateBatch(config: LoadGeneratorConfig): Promise<void> {
	const promises: Promise<void>[] = [];

	for (let i = 0; i < config.metricsPerBatch; i += 1) {
		const type = randomItem(config.types);
		const unitOptions = unitsByType[type];
		const unit = randomItem(unitOptions);
		const value = randomValue(type);
		const userId = randomItem(config.userIds);
		const date = randomDateInLastYear();

		const input: CollectorInput = {
			userId,
			type,
			value,
			unit,
			date,
		};

		promises.push(collectMetric(input));
	}

	await Promise.all(promises);
	// eslint-disable-next-line no-console
	console.log(
		`Generated ${config.metricsPerBatch} metrics for ${config.userIds.length} user(s) with random dates in the last year`,
	);
}

async function main(): Promise<void> {
	const defaultUserIds = [randomUUID()];

	const config: LoadGeneratorConfig = {
		metricsPerBatch: getEnvNumber("METRICS_PER_BATCH", 1_000),
		intervalMs: getEnvNumber("METRIC_INTERVAL_MS", 5 * 60_000),
		userIds: getEnvList("METRIC_USER_IDS", defaultUserIds),
		types: [...MetricTypes],
	};

	// eslint-disable-next-line no-console
	console.log(
		`Starting load generator: ${config.metricsPerBatch} metrics every ${
			config.intervalMs / 60_000
		} minute(s) for ${config.userIds.length} user(s)`,
	);

	await generateBatch(config);

	setInterval(() => {
		void generateBatch(config).catch((err) => {
			// eslint-disable-next-line no-console
			console.error("Failed to generate metric batch", err);
		});
	}, config.intervalMs).unref();
}

void main().catch((err) => {
	// eslint-disable-next-line no-console
	console.error("Metric generator failed to start", err);
	process.exitCode = 1;
});

