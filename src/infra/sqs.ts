import {
	SQSClient,
	CreateQueueCommand,
	GetQueueUrlCommand,
	SendMessageCommand,
	ReceiveMessageCommand,
	DeleteMessageBatchCommand,
	type Message,
} from "@aws-sdk/client-sqs";
import { env } from "@/common/utils/envConfig";

const sqsClient = new SQSClient({
	region: "us-east-1",
	endpoint: env.SQS_ENDPOINT,
	credentials: {
		accessKeyId: "test",
		secretAccessKey: "test",
	},
});

let queueUrl: string | null = null;

export async function ensureQueue(): Promise<string> {
	if (queueUrl) return queueUrl;

	try {
		const result = await sqsClient.send(
			new GetQueueUrlCommand({ QueueName: env.SQS_QUEUE_NAME }),
		);
		queueUrl = result.QueueUrl!;
	} catch {
		const result = await sqsClient.send(
			new CreateQueueCommand({ QueueName: env.SQS_QUEUE_NAME }),
		);
		queueUrl = result.QueueUrl!;
	}

	return queueUrl;
}

export async function publishMessage(body: Record<string, unknown>): Promise<void> {
	const url = await ensureQueue();
	await sqsClient.send(
		new SendMessageCommand({
			QueueUrl: url,
			MessageBody: JSON.stringify(body),
		}),
	);
}

export async function receiveMessages(maxMessages = 10, waitSeconds = 20): Promise<Message[]> {
	const url = await ensureQueue();
	const result = await sqsClient.send(
		new ReceiveMessageCommand({
			QueueUrl: url,
			MaxNumberOfMessages: maxMessages,
			WaitTimeSeconds: waitSeconds,
		}),
	);
	return result.Messages ?? [];
}

export async function deleteMessages(entries: { Id: string; ReceiptHandle: string }[]): Promise<void> {
	if (entries.length === 0) return;
	const url = await ensureQueue();
	await sqsClient.send(
		new DeleteMessageBatchCommand({
			QueueUrl: url,
			Entries: entries,
		}),
	);
}
