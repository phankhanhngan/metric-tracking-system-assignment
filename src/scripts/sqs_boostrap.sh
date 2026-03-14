#!/bin/bash

echo "Creating SQS queues..."

set -euo pipefail
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"

endpoint_url="http://localhost:4566"

awslocal --endpoint-url="$endpoint_url" sqs create-queue --queue-name "metrics-queue"

echo "SQS queues created."
