import { pino } from "pino";
import { env } from "@/common/utils/envConfig";
import { createApp, finalize } from "@/common/app";
import { healthCheckRouter } from "@/app/healthCheck/healthCheckRouter";
import { collectorRouter } from "@/app/metric/collector/collectorRouter";
import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { ensureQueue } from "@/infra/sqs";

const logger = pino({ name: "metric-collector" });
const app = createApp();

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/metrics", collectorRouter);

// Swagger UI
app.use(openAPIRouter);

finalize(app);

const server = app.listen(env.COLLECTOR_PORT, async () => {
  logger.info(
    `Collector (${env.NODE_ENV}) running on port ${env.COLLECTOR_PORT}`,
  );

  // Ensure SQS queue exists, then start consumer
  try {
    await ensureQueue();
  } catch (err) {
    logger.error(
      { err },
      "Failed to start SQS consumer — will retry on next message",
    );
  }
});

const onCloseSignal = () => {
  logger.info("Shutting down collector");
  server.close(() => {
    logger.info("Collector closed");
    process.exit();
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
