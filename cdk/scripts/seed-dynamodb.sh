#!/usr/bin/env bash
# Seeds the DynamoDB table (compliance-data) with products, customers, countries, and suppliers.
# Usage: ./seed-dynamodb.sh
set -euo pipefail

TABLE_NAME="${TABLE_NAME:-compliance-data}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

command -v aws >/dev/null || { echo "aws CLI required"; exit 1; }
command -v jq >/dev/null || { echo "jq required"; exit 1; }

echo "Seeding ${TABLE_NAME}..."
jq -c '.[]' "${SCRIPT_DIR}/seed-data.json" | while read -r item; do
  aws dynamodb put-item \
    --table-name "${TABLE_NAME}" \
    --item "$(jq -c 'to_entries | map({key: .key, value: (if (.value | type) == "array" or (.value | type) == "object" then {M: .value} elif (.value | type) == "boolean" then {BOOL: .value} elif (.value | type) == "number" then {N: (.value | tostring)} else {S: (.value | tostring)} end)}) | from_entries' <<<"${item}")"
done

echo "Done. Item count:"
aws dynamodb scan --table-name "${TABLE_NAME}" --select COUNT --query 'Count'
