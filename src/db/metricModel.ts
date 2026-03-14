import {
  DistanceUnits,
  TemperatureUnits,
  MetricTypes,
  unitsByType,
} from "@/common/utils/unit";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const allUnits = [...DistanceUnits, ...TemperatureUnits] as const;

// --- Response schemas ---

export const MetricResponseSchema = z.object({
  id: z.number(),
  date: z.string(),
  value: z.number(),
  unit: z.string(),
  originalUnit: z.string(),
  originalValue: z.number(),
});
export type MetricResponse = z.infer<typeof MetricResponseSchema>;

export const ChartDataPointSchema = z.object({
  date: z.string(),
  value: z.number(),
  unit: z.string(),
});
export type ChartDataPoint = z.infer<typeof ChartDataPointSchema>;

// --- Request validation schemas ---

// POST /metrics/:userId
export const CreateMetricSchema = z.object({
  params: z.object({
    userId: z.string().min(1, "userId is required"),
  }),
  body: z
    .object({
      type: z.enum(MetricTypes),
      value: z.number({
        required_error: "value is required",
        invalid_type_error: "value must be a number",
      }),
      unit: z.enum(allUnits),
      date: z
        .string()
        .datetime({ message: "date must be a valid ISO-8601 string" }),
    })
    .refine((data) => unitsByType[data.type].includes(data.unit), {
      message: "unit does not belong to the specified type",
      path: ["unit"],
    }),
});

// POST /metrics/batch
export const BatchMetricSchema = z.object({
  metrics: z.array(
    z.object({
      user_id: z.string(),
      type: z.string(),
      date: z.string(),
      value: z.number(),
      original_value: z.number(),
      original_unit: z.string(),
    }),
  ),
});

// GET /metrics/:userId/list
export const GetMetricsSchema = z.object({
  params: z.object({
    userId: z.string().min(1, "userId is required"),
  }),
  query: z.object({
    type: z.enum(MetricTypes),
    unit: z.enum(allUnits).optional(),
    limit: z.coerce.number().int().positive().default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }),
});

// GET /metrics/:userId/chart
export const GetChartSchema = z.object({
  params: z.object({
    userId: z.string().min(1, "userId is required"),
  }),
  query: z.object({
    type: z.enum(MetricTypes),
    unit: z.enum(allUnits).optional(),
    filterStart: z
      .string()
      .datetime({ message: "filterStart must be a valid ISO-8601 string" })
      .optional(),
    filterEnd: z
      .string()
      .datetime({ message: "filterEnd must be a valid ISO-8601 string" })
      .optional(),
  }),
});
