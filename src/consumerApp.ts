export { app, logger };
import { pino } from "pino";
import { env } from "@/common/utils/envConfig";
import { createApp, finalize } from "@/common/app";
import { healthCheckRouter } from "@/app/healthCheck/healthCheckRouter";
import { connectRedis, disconnectRedis } from "@/infra/redis";
import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { consumerRouter } from "@/app/metric/consumer/consumerRouter";

const logger = pino({ name: "metric-query" });
const app = createApp();

app.use("/health-check", healthCheckRouter);
app.use("/metrics", consumerRouter);

// Swagger UI
app.use(openAPIRouter);

finalize(app);

const server = app.listen(env.CONSUMER_PORT, async () => {
  logger.info(
    `Consumer service (${env.NODE_ENV}) running on port ${env.CONSUMER_PORT}`,
  );

  try {
    await connectRedis();
    logger.info("Redis connected");
  } catch (err) {
    logger.error({ err }, "Failed to connect to Redis");
  }
});

const onCloseSignal = async () => {
  logger.info("Shutting down Consumer service");
  await disconnectRedis();
  server.close(() => {
    logger.info("Consumer service closed");
    process.exit();
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
