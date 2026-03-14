import { pino } from "pino";
import { env } from "@/common/utils/envConfig";
import { createApp, finalize } from "@/common/app";
import { healthCheckRouter } from "@/app/healthCheck/healthCheckRouter";
import { queryRouter } from "@/app/metric/query/queryRouter";
import { connectRedis, disconnectRedis } from "@/infra/redis";
import { openAPIRouter } from "@/api-docs/openAPIRouter";

const logger = pino({ name: "metric-query" });
const app = createApp();

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/metrics", queryRouter);

// Swagger UI
app.use(openAPIRouter);

finalize(app);

const server = app.listen(env.QUERY_PORT, async () => {
	logger.info(`Query service (${env.NODE_ENV}) running on port ${env.QUERY_PORT}`);

	try {
		await connectRedis();
		logger.info("Redis connected");
	} catch (err) {
		logger.error({ err }, "Failed to connect to Redis");
	}
});

const onCloseSignal = async () => {
	logger.info("Shutting down query service");
	await disconnectRedis();
	server.close(() => {
		logger.info("Query service closed");
		process.exit();
	});
	setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
