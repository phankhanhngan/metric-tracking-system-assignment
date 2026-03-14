import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { CreateMetricSchema } from "../../../db/metricModel";
import { createMetric } from "@/app/metric/collector/collectorController";

export const collectorRegistry = new OpenAPIRegistry();
export const collectorRouter: Router = express.Router();

collectorRegistry.registerPath({
	method: "post",
	path: "/metrics/{userId}",
	tags: ["Metric Collector"],
	request: {
		params: CreateMetricSchema.shape.params,
		body: {
			content: { "application/json": { schema: CreateMetricSchema.shape.body } },
		},
	},
	responses: createApiResponse(z.null(), "Metric accepted for processing", 202),
});

collectorRouter.post("/:userId", validateRequest(CreateMetricSchema), createMetric);
