import type { Request, RequestHandler, Response } from "express";
import { listMetrics, getChartData } from "./queryService";
import { MetricType } from "@/common/utils/unit";
import { GetMetricChartQuery, ListMetricsQuery } from "@/db/metricModel";

export const getMetrics: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const userId = req.params.userId;
  const { type, unit, limit, offset } =
    req.query as unknown as ListMetricsQuery;

  const serviceResponse = await listMetrics(
    userId,
    type,
    Number(limit),
    Number(offset),
    unit,
  );
  res.status(serviceResponse.statusCode).send(serviceResponse);
};

export const getChart: RequestHandler = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { type, unit, filterStart, filterEnd } =
    req.query as unknown as GetMetricChartQuery;

  const serviceResponse = await getChartData(
    userId,
    type,
    filterStart,
    filterEnd,
    unit,
  );
  res.status(serviceResponse.statusCode).send(serviceResponse);
};
