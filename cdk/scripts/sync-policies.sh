#!/usr/bin/env bash
# Uploads the policy documents to the knowledge-base S3 bucket and starts an ingestion job.
# Usage: BUCKET_NAME=gtm-compliance-policies-<account>-<region> ./sync-policies.sh
set -euo pipefail

BUCKET_NAME="${BUCKET_NAME:?Set BUCKET_NAME to the PoliciesBucket from the CDK stack output}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICIES_DIR="$(cd "${SCRIPT_DIR}/../policies" && pwd)"

echo "Uploading policies from ${POLICIES_DIR} to s3://${BUCKET_NAME}/policies/"
aws s3 sync "${POLICIES_DIR}" "s3://${BUCKET_NAME}/policies/" \
  --exclude "*" --include "*.md" --include "*.pdf"

KB_ID="${KB_ID:-}"
if [ -n "${KB_ID}" ]; then
  DATA_SOURCE_ID="$(aws bedrock-agent list-data-sources --knowledge-base-id "${KB_ID}" --query 'dataSourceSummaries[0].dataSourceId' --output text)"
  echo "Starting ingestion job for KB ${KB_ID}, data source ${DATA_SOURCE_ID}..."
  aws bedrock-agent start-ingestion-job \
    --knowledge-base-id "${KB_ID}" \
    --data-source-id "${DATA_SOURCE_ID}" \
    --description "Policy sync $(date -u +%FT%TZ)"
else
  echo "KB_ID not set — skipping ingestion job. Set KB_ID=<knowledge-base-id> to trigger indexing."
fi
