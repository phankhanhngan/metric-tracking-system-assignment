import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("production"),

	HOST: z.string().min(1).default("localhost"),

	PORT: z.coerce.number().int().positive().default(8080),

	COLLECTOR_PORT: z.coerce.number().int().positive().default(8081),

	QUERY_PORT: z.coerce.number().int().positive().default(8082),

	CONSUMER_PORT: z.coerce.number().int().positive().default(8083),

	CORS_ORIGIN: z.string().url().default("http://localhost:8080"),

	COMMON_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(1000),

	COMMON_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(1000),

	DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/metric_tracking"),

	REDIS_URL: z.string().min(1).default("redis://localhost:6379"),

	SQS_ENDPOINT: z.string().min(1).default("http://localhost:4566"),

	SQS_QUEUE_NAME: z.string().min(1).default("metrics-queue"),

	LAMBDA_SECRET: z.string().min(1).default("super-secret-key"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	console.error("❌ Invalid environment variables:", parsedEnv.error.format());
	throw new Error("Invalid environment variables");
}

export const env = {
	...parsedEnv.data,
	isDevelopment: parsedEnv.data.NODE_ENV === "development",
	isProduction: parsedEnv.data.NODE_ENV === "production",
	isTest: parsedEnv.data.NODE_ENV === "test",
};
