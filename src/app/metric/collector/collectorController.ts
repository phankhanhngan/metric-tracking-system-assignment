import type { Request, Response } from "express";
import { collectMetric } from "./collectorService";
import { CreateMetricBody } from "@/db/metricModel";

export async function createMetric(req: Request, res: Response) {
  const { userId } = req.params;
  const { type, value, unit, date } = req.body as CreateMetricBody;

  await collectMetric({ userId, type, value, unit, date });

  res.status(202).json({ message: "Metric accepted for processing" });
}
