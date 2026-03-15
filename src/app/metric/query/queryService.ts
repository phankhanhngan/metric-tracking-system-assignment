import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { toISO, toDateString, parseISO } from "@/common/utils/dateUtils";
import { cacheGet, chooseTTL } from "@/infra/cache";
import type { ChartDataPoint, MetricResponse } from "@/db/metricModel";
import { MetricRepository } from "@/db/metricRepository";
import { MetricType, getBaseUnit, fromBase } from "@/common/utils/unit";

const repository = new MetricRepository();

export async function listMetrics(
  userId: string,
  type: MetricType,
  limit: number,
  offset: number,
  targetUnit?: string,
): Promise<ServiceResponse<MetricResponse[]>> {
  try {
    const unit = targetUnit || getBaseUnit(type);
    const cacheKey = `metrics:list:${userId}:${type}:${limit}:${offset}:${unit}`;

    const metrics = await cacheGet(
      cacheKey,
      async () => {
        const rows = await repository.findByUserAndType(
          userId,
          type,
          limit,
          offset,
        );
        return rows.map((row) => ({
          id: row.id,
          date: toISO(row.date),
          value: targetUnit
            ? fromBase(Number(row.value), targetUnit)
            : Number(row.value),
          unit,
          originalUnit: row.original_unit,
          originalValue: Number(row.original_value),
        }));
      },
      chooseTTL(),
    );

    return ServiceResponse.success("Metrics retrieved", metrics);
  } catch (ex) {
    return ServiceResponse.failure(
      "An error occurred while retrieving metrics.",
      [],
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
}

export async function getChartData(
  userId: string,
  type: MetricType,
  filterStart?: string,
  filterEnd?: string,
  targetUnit?: string,
): Promise<ServiceResponse<ChartDataPoint[]>> {
  try {
    const unit = targetUnit || getBaseUnit(type);
    const cacheKey = `metrics:chart:${userId}:${type}:${filterStart || ""}:${filterEnd || ""}:${unit}`;
    const endDate = filterEnd ? parseISO(filterEnd) : undefined;

    const data = await cacheGet(
      cacheKey,
      async () => {
        const startDate = filterStart ? parseISO(filterStart) : undefined;
        const rows = await repository.findChartData(
          userId,
          type,
          startDate,
          endDate,
        );
        return rows.map((row) => ({
          date: toDateString(row.day),
          value: targetUnit
            ? fromBase(Number(row.value), targetUnit)
            : Number(row.value),
          unit,
        }));
      },
      chooseTTL(endDate),
    );

    return ServiceResponse.success("Chart data retrieved", data);
  } catch (ex) {
    return ServiceResponse.failure(
      "An error occurred while retrieving chart data.",
      [],
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
}
