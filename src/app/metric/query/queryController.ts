import type { Request, RequestHandler, Response } from "express";
import { listMetrics, getChartData } from "./queryService";
import { MetricType } from "@/common/utils/unit";

export const getMetrics: RequestHandler = async (req: Request, res: Response) => {
	const userId = req.params.userId;
	const { type, unit, limit, offset } = req.query as {
		type: MetricType;
		unit?: string;
		limit: string;
		offset: string;
	};
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
	const { type, unit, filterStart, filterEnd } = req.query as {
		type: MetricType;
		unit?: string;
		filterStart?: string;
		filterEnd?: string;
	};
	const serviceResponse = await getChartData(userId, type, filterStart, filterEnd, unit);
	res.status(serviceResponse.statusCode).send(serviceResponse);
};
