import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";

import { healthCheckRegistry } from "@/app/healthCheck/healthCheckRouter";
import { collectorRegistry } from "@/app/metric/collector/collectorRouter";
import { queryRegistry } from "@/app/metric/query/queryRouter";

export type OpenAPIDocument = ReturnType<
  OpenApiGeneratorV3["generateDocument"]
>;

export function generateOpenAPIDocument(): OpenAPIDocument {
  const registry = new OpenAPIRegistry([
    healthCheckRegistry,
    collectorRegistry,
    queryRegistry,
  ]);
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Metric Tracking API",
    },
    externalDocs: {
      description: "View the raw OpenAPI Specification in JSON format",
      url: "/swagger.json",
    },
  });
}
