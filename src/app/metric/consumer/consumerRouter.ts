import express, { type Router } from "express";
import { processBatch } from "./consumerController";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import z from "zod";
import { CreateBatchMetricSchema } from "@/db/metricModel";

export const consumerRouter: Router = express.Router();

export const consumerRegistry = new OpenAPIRegistry();

consumerRegistry.registerPath({
  method: "post",
  path: "/metrics/batch",
  tags: ["Metric Collector"],
  request: {
    body: {
      content: {
        "application/json": { schema: CreateBatchMetricSchema.shape },
      },
    },
  },
  responses: createApiResponse(z.null(), "Metric accepted for processing", 202),
});

// Internal endpoint — authenticated via X-Lambda-Key header
consumerRouter.post("/batch", processBatch);
