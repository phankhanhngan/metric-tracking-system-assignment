import type { Request, Response } from "express";
import { collectMetric } from "./collectorService";

export async function createMetric(req: Request, res: Response) {
	const { userId } = req.params;
	const { type, value, unit, date } = req.body;

	await collectMetric({ userId, type, value, unit, date });

	res.status(202).json({ message: "Metric accepted for processing" });
}
