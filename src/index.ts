import { env } from "@/common/utils/envConfig";
import { app, logger } from "@/consumerApp";

const server = app.listen(env.CONSUMER_PORT, () => {
	const { NODE_ENV, HOST, CONSUMER_PORT } = env;
	logger.info(`Consumer (${NODE_ENV}) running on port http://${HOST}:${CONSUMER_PORT}`);
});

const onCloseSignal = () => {
	logger.info("sigint received, shutting down");
	server.close(() => {
		logger.info("server closed");
		process.exit();
	});
	setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
