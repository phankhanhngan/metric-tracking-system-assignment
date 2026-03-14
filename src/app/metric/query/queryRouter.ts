import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { getMetrics, getChart } from "./queryController";
import { ChartDataPointSchema, GetChartSchema, GetMetricsSchema, MetricResponseSchema } from "../../../db/metricModel";

export const queryRegistry = new OpenAPIRegistry();
export const queryRouter: Router = express.Router();

queryRegistry.register("Metric", MetricResponseSchema);
queryRegistry.register("ChartDataPoint", ChartDataPointSchema);

// GET /metrics/list/:userId
queryRegistry.registerPath({
	method: "get",
	path: "/metrics/list/{userId}",
	tags: ["Metric Query"],
	request: {
		params: GetMetricsSchema.shape.params,
		query: GetMetricsSchema.shape.query,
	},
	responses: createApiResponse(z.array(MetricResponseSchema), "Success"),
});

queryRouter.get("/list/:userId", validateRequest(GetMetricsSchema), getMetrics);

// GET /metrics/chart/:userId
queryRegistry.registerPath({
	method: "get",
	path: "/metrics/chart/{userId}",
	tags: ["Metric Query"],
	request: {
		params: GetChartSchema.shape.params,
		query: GetChartSchema.shape.query,
	},
	responses: createApiResponse(z.array(ChartDataPointSchema), "Success"),
});

queryRouter.get("/chart/:userId", validateRequest(GetChartSchema), getChart);
