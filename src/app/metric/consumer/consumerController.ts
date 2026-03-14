import type { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { env } from "@/common/utils/envConfig";
import { batchInsert, type BatchMetric } from "./consumerService";

export const processBatch: RequestHandler = async (req: Request, res: Response) => {
	const lambdaKey = req.headers["x-lambda-key"] as string;

	if (lambdaKey !== env.LAMBDA_SECRET) {
		const response = ServiceResponse.failure("Unauthorized", null, StatusCodes.UNAUTHORIZED);
		res.status(response.statusCode).send(response);
		return;
	}

	try {
		const metrics: BatchMetric[] = req.body.metrics;
		const count = await batchInsert(metrics);
		const response = ServiceResponse.success(`Inserted ${count} metrics`, { count }, StatusCodes.OK);
		res.status(response.statusCode).send(response);
	} catch (err) {
		const response = ServiceResponse.failure(
			"Batch insert failed",
			null,
			StatusCodes.INTERNAL_SERVER_ERROR,
		);
		res.status(response.statusCode).send(response);
	}
};
