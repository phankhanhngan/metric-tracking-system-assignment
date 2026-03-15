import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { getMetrics, getChart } from "./queryController";
import {
  ChartDataPointSchema,
  GetMetricChartSchema,
  ListMetricsSchema,
  MetricResponseSchema,
} from "../../../db/metricModel";

export const queryRegistry = new OpenAPIRegistry();
export const queryRouter: Router = express.Router();

queryRegistry.register("Metric", MetricResponseSchema);
queryRegistry.register("ChartDataPoint", ChartDataPointSchema);

// GET /metrics/list/:userId
queryRegistry.registerPath({
  method: "get",
  path: "/metrics/{userId}/list",
  tags: ["Metric Query"],
  request: {
    params: ListMetricsSchema.shape.params,
    query: ListMetricsSchema.shape.query,
  },
  responses: createApiResponse(z.array(MetricResponseSchema), "Success"),
});

queryRouter.get(
  "/:userId/list",
  validateRequest(ListMetricsSchema),
  getMetrics,
);

// GET /metrics/chart/:userId
queryRegistry.registerPath({
  method: "get",
  path: "/metrics/{userId}/chart",
  tags: ["Metric Query"],
  request: {
    params: GetMetricChartSchema.shape.params,
    query: GetMetricChartSchema.shape.query,
  },
  responses: createApiResponse(z.array(ChartDataPointSchema), "Success"),
});

queryRouter.get(
  "/:userId/chart",
  validateRequest(GetMetricChartSchema),
  getChart,
);
